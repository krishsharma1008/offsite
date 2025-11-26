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
  console.log('[getAllPhotos] Starting fetch - V2 NO JOIN');
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
    
    // Fetch user profiles separately
    const userIds = [...new Set(photosOnly.map(p => p.user_id))];
    console.log('[getAllPhotos] Fetching profiles for user IDs:', userIds);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profile')
      .select('id, display_name, email')
      .in('id', userIds);
    
    console.log('[getAllPhotos] Profiles result:', { count: profiles?.length, error: profilesError });
    
    if (profilesError) {
      console.error('[getAllPhotos] Error fetching profiles:', profilesError);
      // Return photos without profile data
      return photosOnly.map(photo => ({
        ...photo,
        users_profile: null
      }));
    }
    
    // Merge photos with profiles
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    
    const result = photosOnly.map(photo => ({
      ...photo,
      users_profile: profileMap.get(photo.user_id) || null
    }));
    
    console.log('[getAllPhotos] Returning', result.length, 'photos with profiles');
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

