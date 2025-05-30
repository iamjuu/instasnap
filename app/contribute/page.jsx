'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react';
import NavFooter from '../components/navfooter';
import { UploadCloud, X, CheckCircle, AlertCircle, Clock, Image as ImageIcon, UploadCloudIcon, Upload, UploadIcon, LucideUploadCloud } from 'lucide-react';
import Image from 'next/image';
import Button from '../components/button'; // Assuming Button component exists and works
import { EventHeader } from '../components/header';
import instance from '../instance';

const MAX_FILES = 10;

const ContributePage = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({ message: '', type: '' }); // type: 'success' or 'error'
    const [uploadedImages, setUploadedImages] = useState([]); // State for previously uploaded images
    const [isLoadingUploads, setIsLoadingUploads] = useState(true); // Loading state for uploads section
    const [isDragging, setIsDragging] = useState(false); // Add state for drag status
    const fileInputRef = useRef(null);
const ImgCdn = 'https://event-hex-saas.s3.us-east-1.amazonaws.com/'
    // Fetch Previously Uploaded Images from API
    useEffect(() => {
        const fetchContributes = async () => {
            setIsLoadingUploads(true);
            try {
                const res = await instance.get("contribute");
                console.log("API response:", res);
                
                if (res.data && res.data.success && res.data.response) {
                    // Map the API response to the expected format
                    const formattedImages = res.data.response.map(item => {
                        // Ensure we have a valid URL by checking all possible image sources
                        const imageUrl = item.thumbnail || item.compressed || item.image;
                        return {
                            id: item._id,
                            url: item.image,
                            status: item.approve ? 'approved' : 'pending'
                        };
                    });
                    setUploadedImages(formattedImages);
                }
            } catch (error) {
                console.error("Error fetching contributions:", error);
            } finally {
                setIsLoadingUploads(false);
            }
        };
        
        fetchContributes();
    }, []);

    // Clean up preview URLs when component unmounts or previews change
    useEffect(() => {
        return () => {
            previews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previews]);

    const handleFileChange = useCallback((event) => {
        const files = Array.from(event.target.files || []);
        setUploadStatus({ message: '', type: '' }); // Clear previous status

        const newFiles = files.filter(file => file.type.startsWith('image/'));
        const totalFiles = selectedFiles.length + newFiles.length;

        if (totalFiles > MAX_FILES) {
            setUploadStatus({ message: `You can only select up to ${MAX_FILES} photos.`, type: 'error' });
            // Keep existing files, don't add new ones exceeding the limit
            event.target.value = null; // Clear the input
            return;
        }
        
        const combinedFiles = [...selectedFiles, ...newFiles];
        setSelectedFiles(combinedFiles);

        const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviewUrls]);
        
        event.target.value = null; // Clear the input for subsequent selections

    }, [selectedFiles]);

    const handleRemovePreview = useCallback((indexToRemove) => {
        setPreviews(prev => {
            const newPreviews = prev.filter((_, index) => index !== indexToRemove);
            URL.revokeObjectURL(prev[indexToRemove]); // Clean up the specific URL
            return newPreviews;
        });
        setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    }, []);

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setIsUploading(true);
        setUploadStatus({ message: '', type: '' });

        console.log("Uploading files:", selectedFiles);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload delay
        
        // --- Start Placeholder API Interaction --- 
        // Simulate getting back data from the server after upload
        const newUploadedImagesData = selectedFiles.map((file, index) => ({
            id: `new_${Date.now()}_${index}`,
            url: URL.createObjectURL(file), // Use the actual file URL instead of picsum
            status: 'pending' // New uploads are pending
        }));
        // Prepend new uploads to the displayed list
        setUploadedImages(prev => [...newUploadedImagesData, ...prev]);
        // --- End Placeholder API Interaction --- 

        setUploadStatus({ message: 'Upload successful! Photos are pending review.', type: 'success' });
        setSelectedFiles([]); 
        // Now it's safe to clear previews and revoke the blob URLs
        previews.forEach(url => URL.revokeObjectURL(url)); // Explicitly revoke here
        setPreviews([]); 

        setIsUploading(false);
    };

    // Helper to render status badge
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center shadow">
                        <Clock size={10} className="mr-1" /> Pending
                    </span>
                );
            case 'approved':
                return (
                    <span className="absolute top-1 left-1 bg-green-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center shadow">
                       <CheckCircle size={10} className="mr-1"/> Approved
                    </span>
                );
            // Add case for 'rejected' if needed
            default:
                return null;
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            setUploadStatus({ message: 'Please drop only image files.', type: 'error' });
            return;
        }

        const totalFiles = selectedFiles.length + imageFiles.length;
        if (totalFiles > MAX_FILES) {
            setUploadStatus({ message: `You can only select up to ${MAX_FILES} photos.`, type: 'error' });
            return;
        }

        setSelectedFiles(prev => [...prev, ...imageFiles]);
        const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviewUrls]);
    };

    return (
        <div className="flex justify-center w-full">
        <div className="flex flex-col min-h-screen w-full max-w-[768px] mx-auto">
          {/* Optional Header can go here */}
          <div className="flex-grow p-4 md:p-6 mb-[70px] overflow-y-auto w-full"> {/* Adjust margin for footer */}
            <div className="w-full flex justify-center">
              <EventHeader name={"Contribute"}/>
            </div>
            
            <p className="text-center text-gray-600 mb-6 text-sm">Upload up to {MAX_FILES} photos. Approved photos will appear in the public gallery.</p>
  
            {/* Upload Area */} 
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center mb-6 cursor-pointer transition-colors duration-200 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*" // Accept only image files
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading} // Disable while uploading
              />
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-700 font-medium">Click or drag & drop to upload</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB (Max {MAX_FILES} files)</p>
            </div>
  
            {/* Upload Status Messages */} 
            {uploadStatus.message && (
              <div className={`p-3 rounded-md mb-4 text-sm ${uploadStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center`}>
                {uploadStatus.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                {uploadStatus.message}
              </div>
            )}
  
            {/* Previews Section */} 
            {previews.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-3 text-gray-700">Selected ({previews.length}/{MAX_FILES})</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {previews.map((previewUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-200 group">
                      <Image 
                        src={previewUrl}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button 
                        onClick={() => !isUploading && handleRemovePreview(index)} // Prevent removal during upload
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-75 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove image"
                        disabled={isUploading}
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {/* Upload Button */} 
            {selectedFiles.length > 0 && (
              <Button 
                type="button"
                variant="default"
                disabled={isUploading}
                onClick={handleUpload}
                className="w-full md:w-auto px-8 mt-4"
                icon={!isUploading ? '' : null}
                iconPosition="left"
              >
                {isUploading ? (
                  <>
                  ''
                    Uploading...
                  </>
                ) : (
                  `Upload ${selectedFiles.length} Photo${selectedFiles.length > 1 ? 's' : ''}`
                )}
              </Button>
            )}
  
            {/* Your Uploads Section */}
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-3 text-gray-700">Your Uploads</h2>
              {isLoadingUploads ? (
                <div className="flex justify-center items-center py-10">
                  <svg className="animate-spin h-10 w-10 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : uploadedImages.length > 0 ? (
                <div className="grid grid-cols-2  mb-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {uploadedImages.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-md overflow-hidden border border-gray-200 group">
                      <Image 
                        src={ ImgCdn + image.url} 
                        alt={`Uploaded ${image.id}`}
                        fill
                        className="object-cover bg-gray-100"
                      />
                      {renderStatusBadge(image.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <ImageIcon className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p>No uploads found</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="sticky bottom-0 z-10 w-full bg-white border-t border-gray-100">
            <NavFooter />
          </div>
        </div>
      </div>
    );
};

export default ContributePage;