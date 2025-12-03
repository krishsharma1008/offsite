/**
 * Cleanup script for orphaned photo records
 * 
 * This script identifies and deletes database records for photos where
 * the storage files have been deleted but the database records still exist.
 * 
 * Usage: node scripts/cleanup-orphaned-photos.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptqrfhvqyzqkdosnfkhg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXJmaHZxeXpxa2Rvc25ma2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjYzMDAsImV4cCI6MjA3OTcwMjMwMH0.rxjdduoIZkAL2KmkgUv7AIRE1u5CLm8UVRztpFKCGsY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if a storage file exists by checking the public URL
async function checkStorageFileExists(publicUrl) {
  try {
    const response = await fetch(publicUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('[checkStorageFileExists] Error checking file:', error.message);
    return true; // Assume exists on error to avoid false positives
  }
}

// Clean up orphaned photo records
async function cleanupOrphanedPhotos() {
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

// Run cleanup
cleanupOrphanedPhotos()
  .then(result => {
    if (result.success) {
      console.log(`✅ Cleanup completed successfully. Deleted ${result.deleted} orphaned records.`);
      process.exit(0);
    } else {
      console.error(`❌ Cleanup failed: ${result.error}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });



