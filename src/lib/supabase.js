import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptqrfhvqyzqkdosnfkhg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXJmaHZxeXpxa2Rvc25ma2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjYzMDAsImV4cCI6MjA3OTcwMjMwMH0.rxjdduoIZkAL2KmkgUv7AIRE1u5CLm8UVRztpFKCGsY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Retry an async operation with exponential backoff
 */
async function retryWithBackoff(
  operation,
  maxRetries = 3,
  baseDelay = 1000,
  onRetry = null
) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (auth, validation, etc.)
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        console.log('[Retry] Client error detected, not retrying:', error.statusCode);
        throw error;
      }

      // Last attempt - throw error
      if (attempt === maxRetries - 1) {
        console.error('[Retry] All retry attempts exhausted');
        throw error;
      }

      // Calculate exponential backoff delay: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);

      // Notify about retry
      if (onRetry) {
        onRetry(attempt + 1, maxRetries, delay);
      }

      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
      console.log(`[Retry] Retrying in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Helper to get public URL for a photo
export function getPhotoPublicUrl(storagePath) {
  const { data } = supabase.storage.from('photos').getPublicUrl(storagePath);
  return data.publicUrl;
}

// Upload photo to storage and save metadata
export async function uploadPhoto(userId, photoDataUrl, eventName = 'Zapcom Offsite', onProgress = null) {
  console.log('[uploadPhoto] Starting upload for user:', userId);
  const startTime = Date.now();

  try {
    // Convert base64 to blob
    console.log('[uploadPhoto] Converting to blob...');
    const response = await fetch(photoDataUrl);
    const blob = await response.blob();
    const fileSizeKB = Math.round(blob.size / 1024);
    console.log('[uploadPhoto] Blob created, size:', fileSizeKB, 'KB');

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}.jpg`;
    console.log('[uploadPhoto] Filename:', filename);

    // Upload to storage with retry and timeout
    console.log('[uploadPhoto] Uploading to Supabase storage with retry...');

    let currentAttempt = 0;
    const maxRetries = 3;

    // Define upload operation with timeout
    const uploadOperation = async () => {
      const uploadPromise = supabase.storage
        .from('photos')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      // 60 second timeout per attempt (increased from 30s)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout after 60s')), 60000)
      );

      return await Promise.race([uploadPromise, timeoutPromise]);
    };

    // Execute with retry
    const { data: uploadData, error: uploadError } = await retryWithBackoff(
      uploadOperation,
      maxRetries,
      2000, // 2s initial delay
      (attempt, max, delay) => {
        currentAttempt = attempt;
        console.log(`[uploadPhoto] Retry ${attempt}/${max} scheduled in ${delay}ms`);
        if (onProgress) {
          onProgress({ status: 'retrying', attempt, max, delay });
        }
      }
    );

    const uploadDuration = Date.now() - startTime;
    console.log('[uploadPhoto] Storage upload complete in', uploadDuration, 'ms');
    console.log('[uploadPhoto] Result:', { data: uploadData, error: uploadError, attempts: currentAttempt + 1 });

    if (uploadError) {
      console.error('[uploadPhoto] Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const publicUrl = getPhotoPublicUrl(filename);
    console.log('[uploadPhoto] Public URL:', publicUrl);

    // Save metadata to database
    console.log('[uploadPhoto] Saving to database...');
    const { data: photoData, error: dbError } = await supabase
      .from('photos')
      .insert({
        user_id: userId,
        storage_path: filename,
        public_url: publicUrl,
        event_name: eventName
      })
      .select()
      .single();

    console.log('[uploadPhoto] Database result:', { data: photoData, error: dbError });

    if (dbError) {
      console.error('[uploadPhoto] Database error:', dbError);
      // Try to delete the uploaded file if db insert fails
      await supabase.storage.from('photos').remove([filename]);
      throw dbError;
    }

    const totalDuration = Date.now() - startTime;
    console.log('[uploadPhoto] Success! Total time:', totalDuration, 'ms, File size:', fileSizeKB, 'KB');
    return { success: true, photo: photoData };
  } catch (error) {
    console.error('[uploadPhoto] Failed:', error);
    return { success: false, error: error.message };
  }
}

// Get user's photo count
export async function getUserPhotoCount(userId) {
  const { data, error } = await supabase
    .from('users_profile')
    .select('photo_count')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching photo count:', error);
    return 0;
  }
  
  return data?.photo_count || 0;
}

// Get all photos for the photo book
export async function getAllPhotos() {
  console.log('[getAllPhotos] Starting fetch - V2 NO JOIN with storage validation');
  try {
    // Fetch photos first (NO JOIN - separate queries)
    console.log('[getAllPhotos] Fetching photos...');
    const { data: photosOnly, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('[getAllPhotos] Photos result:', { count: photosOnly?.length, error: photosError });
    
    if (photosError) {
      console.error('[getAllPhotos] Error fetching photos:', photosError);
      return [];
    }
    
    if (!photosOnly || photosOnly.length === 0) {
      console.log('[getAllPhotos] No photos found, returning empty array');
      return [];
    }
    
    // Validate storage files exist - filter out photos with missing files
    console.log('[getAllPhotos] Validating storage files...');
    const validPhotos = [];
    const orphanedIds = [];
    
    for (const photo of photosOnly) {
      if (photo.public_url) {
        const exists = await checkStorageFileExists(photo.public_url);
        if (exists) {
          validPhotos.push(photo);
        } else {
          console.warn(`[getAllPhotos] Photo ${photo.id} has missing storage file, filtering out`);
          orphanedIds.push(photo.id);
        }
      } else {
        // If no public_url, skip it
        console.warn(`[getAllPhotos] Photo ${photo.id} has no public_url, filtering out`);
        orphanedIds.push(photo.id);
      }
    }
    
    if (orphanedIds.length > 0) {
      console.log(`[getAllPhotos] Found ${orphanedIds.length} photos with missing storage files`);
      // Optionally clean up orphaned records in background (don't await)
      cleanupOrphanedPhotos().catch(err => {
        console.error('[getAllPhotos] Background cleanup failed:', err);
      });
    }
    
    if (validPhotos.length === 0) {
      console.log('[getAllPhotos] No valid photos found after validation');
      return [];
    }
    
    // Fetch user profiles separately
    const userIds = [...new Set(validPhotos.map(p => p.user_id))];
    console.log('[getAllPhotos] Fetching profiles for user IDs:', userIds);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profile')
      .select('id, display_name, email')
      .in('id', userIds);
    
    console.log('[getAllPhotos] Profiles result:', { count: profiles?.length, error: profilesError });
    
    if (profilesError) {
      console.error('[getAllPhotos] Error fetching profiles:', profilesError);
      // Return photos without profile data
      return validPhotos.map(photo => ({
        ...photo,
        users_profile: null
      }));
    }
    
    // Merge photos with profiles
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    
    const result = validPhotos.map(photo => ({
      ...photo,
      users_profile: profileMap.get(photo.user_id) || null
    }));
    
    console.log('[getAllPhotos] Returning', result.length, 'valid photos with profiles');
    return result;
  } catch (err) {
    console.error('[getAllPhotos] Exception:', err);
    return [];
  }
}

// Get user's own photos
export async function getUserPhotos(userId) {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user photos:', error);
    return [];
  }
  
  return data || [];
}

// Check if a storage file exists by checking the public URL
async function checkStorageFileExists(publicUrl) {
  try {
    // Use HEAD request to check if file exists without downloading
    const response = await fetch(publicUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('[checkStorageFileExists] Error checking file:', error.message);
    // On error, assume file exists to avoid false positives
    return true;
  }
}

// Clean up orphaned photo records (photos where storage files are missing)
export async function cleanupOrphanedPhotos() {
  console.log('[cleanupOrphanedPhotos] Starting cleanup...');
  try {
    // Fetch all photos with public URLs
    const { data: allPhotos, error: fetchError } = await supabase
      .from('photos')
      .select('id, user_id, storage_path, public_url');
    
    if (fetchError) {
      console.error('[cleanupOrphanedPhotos] Error fetching photos:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!allPhotos || allPhotos.length === 0) {
      console.log('[cleanupOrphanedPhotos] No photos found');
      return { success: true, deleted: 0 };
    }
    
    console.log(`[cleanupOrphanedPhotos] Checking ${allPhotos.length} photos...`);
    
    // Check each photo's storage file
    const orphanedIds = [];
    const userPhotoCounts = new Map();
    
    for (const photo of allPhotos) {
      const exists = await checkStorageFileExists(photo.public_url);
      if (!exists) {
        console.log(`[cleanupOrphanedPhotos] Orphaned photo found: ${photo.id} (${photo.storage_path})`);
        orphanedIds.push(photo.id);
        
        // Track photo counts per user
        const currentCount = userPhotoCounts.get(photo.user_id) || 0;
        userPhotoCounts.set(photo.user_id, currentCount + 1);
      }
    }
    
    if (orphanedIds.length === 0) {
      console.log('[cleanupOrphanedPhotos] No orphaned photos found');
      return { success: true, deleted: 0 };
    }
    
    // Delete orphaned records
    console.log(`[cleanupOrphanedPhotos] Deleting ${orphanedIds.length} orphaned records...`);
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .in('id', orphanedIds);
    
    if (deleteError) {
      console.error('[cleanupOrphanedPhotos] Error deleting orphaned photos:', deleteError);
      return { success: false, error: deleteError.message };
    }
    
    // Update user photo counts
    console.log('[cleanupOrphanedPhotos] Updating user photo counts...');
    for (const [userId, deletedCount] of userPhotoCounts.entries()) {
      // Get current count
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('photo_count')
        .eq('id', userId)
        .single();
      
      if (!profileError && profile) {
        const newCount = Math.max(0, (profile.photo_count || 0) - deletedCount);
        await supabase
          .from('users_profile')
          .update({ photo_count: newCount })
          .eq('id', userId);
        console.log(`[cleanupOrphanedPhotos] Updated user ${userId} count: ${profile.photo_count} -> ${newCount}`);
      }
    }
    
    console.log(`[cleanupOrphanedPhotos] Cleanup complete. Deleted ${orphanedIds.length} orphaned records.`);
    return { success: true, deleted: orphanedIds.length };
  } catch (error) {
    console.error('[cleanupOrphanedPhotos] Exception:', error);
    return { success: false, error: error.message };
  }
}

// Delete a photo
export async function deletePhoto(photoId, storagePath) {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([storagePath]);
    
    if (storageError) {
      console.error('Storage delete error:', storageError);
    }
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);
    
    if (dbError) {
      throw dbError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Delete photo failed:', error);
    return { success: false, error: error.message };
  }
}

