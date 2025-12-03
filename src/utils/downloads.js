import JSZip from 'jszip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Sanitize filename by removing invalid characters
 */
const sanitizeFilename = (name) => {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

/**
 * Format date for filename
 */
const formatDateForFilename = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}`;
};

/**
 * Download all photos as a ZIP file
 */
export const downloadPhotosAsZip = async (photos, onProgress) => {
  try {
    const zip = new JSZip();
    const total = photos.length;
    let processed = 0;

    // Fetch and add each photo to the ZIP
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      try {
        // Fetch the image
        const response = await fetch(photo.public_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch photo: ${photo.id}`);
        }
        const blob = await response.blob();

        // Create filename
        const photographer = photo.users_profile?.display_name || 
                           photo.users_profile?.email?.split('@')[0] || 
                           'Anonymous';
        const dateStr = formatDateForFilename(photo.created_at);
        const sanitizedPhotographer = sanitizeFilename(photographer);
        const filename = `${sanitizedPhotographer}_${dateStr}_${i + 1}.jpg`;

        // Add to ZIP
        zip.file(filename, blob);

        processed++;
        if (onProgress) {
          onProgress(processed, total);
        }
      } catch (err) {
        console.error(`Error processing photo ${i + 1}:`, err);
        // Continue with other photos even if one fails
      }
    }

    // Generate ZIP file
    if (onProgress) {
      onProgress(total, total, 'Generating ZIP file...');
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Trigger download
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photobook_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error creating ZIP:', error);
    throw new Error('Failed to create ZIP file. Please try again.');
  }
};

/**
 * Download all photos as a PDF
 */
export const downloadPhotosAsPdf = async (photos, onProgress) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    // Cover page
    pdf.setFillColor(10, 10, 12);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32);
    pdf.text('Photo Book', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text(`${photos.length} ${photos.length === 1 ? 'memory' : 'memories'} captured`, pageWidth / 2, pageHeight / 2, { align: 'center' });
    
    pdf.setFontSize(12);
    const dateStr = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    pdf.text(dateStr, pageWidth / 2, pageHeight / 2 + 15, { align: 'center' });

    pdf.addPage();

    // Photo grid layout: 2 photos per page (stacked vertically)
    const photoWidth = contentWidth;
    const photoHeight = contentHeight / 2 - 5; // Leave some space between photos

    let processed = 0;
    let currentY = margin;

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        // Check if we need a new page (every 2 photos)
        if (i > 0 && i % 2 === 0) {
          pdf.addPage();
          currentY = margin;
        }

        if (onProgress) {
          processed++;
          onProgress(processed, photos.length, `Processing photo ${processed} of ${photos.length}...`);
        }

        // Fetch and convert image to data URL
        const response = await fetch(photo.public_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch photo: ${photo.id}`);
        }
        const blob = await response.blob();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Add image to PDF
        pdf.addImage(dataUrl, 'JPEG', margin, currentY, photoWidth, photoHeight);

        // Add photographer name and date below photo
        pdf.setTextColor(200, 200, 200);
        pdf.setFontSize(10);
        const photographer = photo.users_profile?.display_name || 
                           photo.users_profile?.email?.split('@')[0] || 
                           'Anonymous';
        const date = new Date(photo.created_at);
        const dateFormatted = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        pdf.text(photographer, margin + 2, currentY + photoHeight + 5);
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(8);
        pdf.text(dateFormatted, margin + 2, currentY + photoHeight + 8);

        // Move to next photo position
        currentY += photoHeight + 15; // 15mm spacing between photos

      } catch (err) {
        console.error(`Error processing photo ${i + 1}:`, err);
        // Continue with other photos even if one fails
      }
    }

    // Save PDF
    if (onProgress) {
      onProgress(photos.length, photos.length, 'Generating PDF...');
    }

    const filename = `photobook_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

    return { success: true };
  } catch (error) {
    console.error('Error creating PDF:', error);
    throw new Error('Failed to create PDF. Please try again.');
  }
};




