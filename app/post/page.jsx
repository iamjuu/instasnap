"use client";

import {
  Copy,
  ChevronLeft,
  Upload,
  Check,
  Download,
  Image as ImageIcon,
  Linkedin,
  X as XIcon,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import NavigationBar from "../components/navfooter";
import { Post1, Post2, Post3, LinkedIn } from "../assets";
import Button from "../components/button";
import Image from "next/image";
import { EventHeader } from "../components/header";
import instance from "../instance";
import { useDispatch, useSelector } from 'react-redux';
import { setHighlights, setLoading, setError } from '../redux/slices/highlightsSlice';

// --- Mock Data for Modal ---
const mockYourPhotos = Array.from({ length: 12 }, (_, i) => ({
  id: `my-${i + 1}`,
  src: `https://picsum.photos/seed/mine${i + 1}/200/200`,
}));
const mockEventHighlights = Array.from({ length: 15 }, (_, i) => ({
  id: `hl-${i + 1}`,
  src: `https://picsum.photos/seed/highlight${i + 1}/200/200`,
}));
// --- End Mock Data ---

const SocialShare = () => {
  const [text, setText] = useState(""); // Initialize with empty string
  const [characterCount, setCharacterCount] = useState(0);
  const maxCharacters = 3000;

  // State for the main page photo selection (max 3)
  const [photos, setPhotos] = useState([]); // Start empty or with initial selection if needed

  // State for user uploaded photos
  const [userUploadedPhotos, setUserUploadedPhotos] = useState([]);

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Event Highlights"); // 'Your Photos' or 'Event Highlights'
  const [modalSelectedPhotos, setModalSelectedPhotos] = useState({}); // Track selections within the modal {id: src}

  const [apiImages, setApiImages] = useState([]); // Add this with other state declarations

  const [showDownloadPreview, setShowDownloadPreview] = useState(false);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    if (newText.length <= maxCharacters) {
      setText(newText);
      setCharacterCount(newText.length);
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  // --- Main Page Photo Selection ---
  // (This might be needed if you want to deselect directly on the main page)
  const toggleMainPhotoSelection = (id) => {
    setPhotos((currentPhotos) => currentPhotos.filter((p) => p.id !== id));
  };
  const selectedCount = photos.length; // Count based on the main photos array

  // --- Modal Logic ---
  const openModal = () => {
    // Initialize modal selection based on current main page selection
    const initialModalSelection = photos.reduce((acc, photo) => {
      acc[photo.id] = photo.src;
      return acc;
    }, {});
    setModalSelectedPhotos(initialModalSelection);
    setIsModalOpen(true);
    // Keep the same activeTab as initialized (Event Highlights) instead of changing to 'Highlight'
    // No need to call setActiveTab here if we want to keep the initial tab
  };
  const closeModal = () => setIsModalOpen(false);

  const handleModalPhotoSelect = (id, src) => {
    setModalSelectedPhotos((prev) => {
      const newSelection = { ...prev };
      if (newSelection[id]) {
        delete newSelection[id]; // Deselect
      } else {
        // Allow selecting more than 3 in modal, but enforce on Done
        newSelection[id] = src; // Select
      }
      return newSelection;
    });
  };

  const handleModalDone = () => {
    // Convert selected modal photos object back to array, respecting max 3
    const selectedArray = Object.entries(modalSelectedPhotos)
      .map(([id, src]) => ({ id, src }))
      .slice(0, 3); // Enforce max 3 limit here
    setPhotos(selectedArray);
    closeModal();
  };

  const getModalPhotosForTab = () => {
    if (activeTab === "Your Photos") {
      // Combine user uploaded photos with mock photos
      return [...userUploadedPhotos, ...mockYourPhotos];
    } else {
      // Return highlights from Redux store
      return highlights.map(item => ({
        id: item.id,
        src: item.image
      }));
    }
  };
  // --- End Modal Logic ---

  const [copyText, setCopyText] = useState("Copy");

  const handleCopy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied to clipboard");
        setCopyText("Copied");
        setTimeout(() => {
          setCopyText("Copy");
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const handleDownload = async () => {
    if (!photos || photos.length === 0) {
      alert('No photos to download');
      return;
    }
    setShowDownloadPreview(true);
  };

const handleConfirmDownload = async () => {
  if (!photos || photos.length === 0) {
    alert('No photos to download');
    return;
  }

  try {
    // Create a container div for downloads (hidden)
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);
    
    // Process all photos
    for (const photo of photos) {
      try {
        // Create download function for each image
        const xhr = new XMLHttpRequest();
        xhr.open('GET', photo.src, true);
        xhr.responseType = 'blob';
        
        xhr.onload = function() {
          if (this.status === 200) {
            // Create blob and download link
            const blob = new Blob([this.response], { type: 'image/jpeg' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            
            // Extract filename from S3 URL or use default name
            const filename = photo.src.split('/').pop() || `instasnap-${photo.id}.jpg`;
            
            link.href = url;
            link.download = filename;
            container.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 100);
          }
        };
        
        xhr.send();
        
        // Add a small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`Failed to download photo ${photo.id}:`, error);
      }
    }
    
    // Clean up container and close modal
    setTimeout(() => {
      document.body.removeChild(container);
      setShowDownloadPreview(false);
    }, 1000);
    
  } catch (error) {
    console.error('Download process failed:', error);
    setShowDownloadPreview(false);
  }
};

  const handlePost = () => {
    console.log("Post via LinkedIn action triggered");
  };

  useEffect(() => {
    const Textfetch = async () => {
      const userId = sessionStorage.getItem("userId");
      const eventId = sessionStorage.getItem("eventId");

      if (userId && eventId) {
        try {
          const res = await instance.get(
            `/mobile/social-share?userId=${userId}&eventId=${eventId}`
          );
          if (res.data && res.data.data && res.data.data.images) {
            const formattedImages = res.data.data.images.map((img) => ({
              id: img.imageId,
              src: img.image,
              thumbnail: img.thumbnail,
            }));
            setApiImages(formattedImages);

            // Set the first image as selected if available
            if (formattedImages.length > 0) {
              setPhotos([
                {
                  id: formattedImages[0].id,
                  src: formattedImages[0].src,
                },
              ]);
            }
          }

          // Fetch photo permissions to get social share content
          const photoPermissionRes = await instance.get(
            `/photo-permission?event=${eventId}`
          );
          if (
            photoPermissionRes.data &&
            photoPermissionRes.data.response &&
            photoPermissionRes.data.response[0]
          ) {
            const socialShareContent =
              photoPermissionRes.data.response[0].socialShareContent;
            if (socialShareContent) {
              setText(socialShareContent);
              setCharacterCount(socialShareContent.length);
            }
            sessionStorage.setItem(
              "isWhatsappAuth",
              photoPermissionRes.data.response[0].isWhatsappAuth
            );
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    Textfetch();
  }, []);

  useEffect(() => {
    const fetchPhotoPermission = async () => {
      const eventId = sessionStorage.getItem("eventId");
      if (!eventId) {
        console.error("No eventId found in sessionStorage");
        return;
      }

      try {
        const res = await instance.get(`/photo-permission`, {
          params: { event: eventId }
        });
        
        if (res.data?.response?.[0]) {
          sessionStorage.setItem(
            "isWhatsappAuth",
            res.data.response[0].isWhatsappAuth
          );
          console.log("Photo permission data:", res.data);
        } else {
          console.warn("No photo permission data found in response");
        }
      } catch (error) {
        console.error("Error fetching photo permission:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      }
    };
    fetchPhotoPermission();
  }, []);

  const Rewritecontent = async () => {
    const eventId = sessionStorage.getItem('eventId');
    console.log('eventId from sessionStorage:', eventId);
  
    if (!eventId) {
      console.error('No eventId found in sessionStorage');
      return;
    }
  
    try {
      const response = await instance.get(`user/rewrite?event=${eventId}`);
      console.log(response, 'rewrite-content response');
      if (response.data && response.data.ReWord) {
        setText(response.data.ReWord);
        setCharacterCount(response.data.ReWord.length);
      }
    } catch (error) {
      console.error('rewrite-content error:', error);
    }
  };

  const [limit, setLimit] = useState(30);
  const [skip, setSkip] = useState(0);
  const dispatch = useDispatch();
  
  const { highlights, loading, error } = useSelector((state) => state.highlights);

  useEffect(() => {
    const fetchHighlights = async () => {
      // Only fetch if we don't have data in Redux
      if (highlights.length === 0) {
        dispatch(setLoading(true));
        try {
          const event = sessionStorage.getItem("eventId");
          if (!event) {
            console.error("No eventId found in sessionStorage");
            dispatch(setError("No eventId found"));
            return;
          }

          const response = await instance.get(
            `event-highlight?event=${event}&limit=${limit}&skip=${skip}`
          );

          if (response.data.success) {
            const formattedData = response.data.response.map((item) => ({
              id: item._id,
              image: `https://event-hex-saas.s3.amazonaws.com/${item.image}`,
              date: new Date(item.createdAt).toLocaleDateString(),
            }));
            dispatch(setHighlights(formattedData));
          } else {
            dispatch(setError("Failed to fetch highlights"));
          }
        } catch (error) {
          console.error("Error fetching highlights:", error);
          dispatch(setError(error.message));
        }
      }
    };

    fetchHighlights();
  }, [dispatch, limit, skip, highlights.length]);


  return (
    <div className="flex justify-center w-full">
      <div className="flex flex-col w-full max-w-[768px] mx-auto bg-white">
        <div className="p-4 flex items-center border-b border-gray-200 sticky top-0 bg-white z-10">
          <button onClick={handleGoBack} className="p-1 ">
            <ChevronLeft size={24} strokeWidth={2} className="text-gray-700" />
          </button>
          <div className="w-full flex justify-center">
            <EventHeader name={"Social Share"} />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 pb-[100px]">
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-800 text-sm font-medium">
                Share your thoughts
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center text-blue-600 text-sm font-medium p-1"
              >
                <Copy size={16} className="mr-1" />
                {copyText}
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 mb-3">
              <textarea
                value={text}
                onChange={handleTextChange}
                className="w-full bg-transparent outline-none resize-none text-sm text-gray-800 min-h-[80px]"
                maxLength={maxCharacters}
                placeholder="What's on your mind?"
              ></textarea>
              <div className="text-right text-xs text-gray-500 mt-1">
                {characterCount}/{maxCharacters}
              </div>
            </div>

            <button
              onClick={Rewritecontent}
              className="w-full py-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm font-medium flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <span className="mr-2">✨</span>
              Rewrite with AI
            </button>
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-medium text-gray-800">
                Photos (max 3)
              </h2>
              <button
                onClick={handleDownload}
                className="flex items-center text-blue-600 font-medium text-sm p-1"
              >
                <Download size={16} className="mr-1" />
                Download
              </button>
            </div>

            <div
              className={`grid grid-cols-3 gap-2 mb-4 ${
                selectedCount === 0
                  ? "min-h-[80px] bg-gray-100 rounded-lg flex items-center justify-center"
                  : ""
              }`}
            >
              {selectedCount === 0 && (
                <p className="text-xs text-gray-500">No photos selected</p>
              )}
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square cursor-pointer group"
                
                >
                  <Image
                    src={photo.src}
                    alt={`Selected Photo ${photo.id}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <XIcon size={24} className="text-white" />
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={openModal}
              variant="outline"
              className="w-full text-black mb-3"
            >
              Choose
            </Button>

            <Button
              onClick={handlePost}
              variant="default"
              className="w-full bg-blue-600 hover:bg-blue-700"
              icon={Linkedin}
            >
              Post via LinkedIn
            </Button>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed  max-w-[768px] mx-auto inset-0 z-40 flex flex-col justify-end">
            <div
              className="absolute   inset-0 bg-black/40 animate-fadeIn backdrop-blur-xs"
              onClick={closeModal}
            />

            <div
              className="relative z-50 bg-white rounded-t-2xl pt-4 pb-6 max-h-[80vh] flex flex-col animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-4 pb-2 border-b border-gray-200">
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-500 hover:text-gray-800"
                >
                  <XIcon size={20} />
                </button>
                <h3 className="text-[14px] font-[400]">Choose Photos</h3>
                <button
                  onClick={handleModalDone}
                  className={`text-[14px] font-[400] p-2 ${
                    Object.keys(modalSelectedPhotos).length > 0
                      ? "text-blue-600"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={Object.keys(modalSelectedPhotos).length === 0}
                >
                  Done ({Object.keys(modalSelectedPhotos).length})
                </button>
              </div>

              <div className="flex border-b border-gray-200 mt-2">
                <div className="flex-1 relative">
                  <button
                    className={`w-full py-2 px-4 text-sm font-medium text-center ${
                      activeTab === "Your Photos"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                    onClick={() => setActiveTab("Your Photos")}
                  >
                    Your Photos
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      // Handle file selection
                      if (e.target.files && e.target.files.length > 0) {
                        setActiveTab("Your Photos");
                        // Convert FileList to array of objects
                        const newFiles = Array.from(e.target.files).map(
                          (file, index) => ({
                            id: `upload-${Date.now()}-${index}`,
                            src: URL.createObjectURL(file),
                            file: file, // Store the actual file if needed
                          })
                        );

                        // Add to userUploadedPhotos state
                        setUserUploadedPhotos((prev) => [...newFiles, ...prev]);

                        // Also select the newly added photos in the modal
                        const newSelections = {};
                        newFiles.forEach((file) => {
                          newSelections[file.id] = file.src;
                        });
                        setModalSelectedPhotos((prev) => ({
                          ...prev,
                          ...newSelections,
                        }));
                      }
                    }}
                  />
                </div>
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium text-center ${
                    activeTab === "Event Highlights"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("Event Highlights")}
                >
                  Event Highlights
                </button>
              </div>

              <div className="flex-grow overflow-y-auto px-4 pt-4">
                <div className="grid grid-cols-3 gap-2">
                  {getModalPhotosForTab().map((photo) => {
                    const isSelected = !!modalSelectedPhotos[photo.id];
                    return (
                      <div
                        key={photo.id}
                        className={`relative rounded-md overflow-hidden aspect-square cursor-pointer border-2 ${
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-300"
                            : "border-transparent"
                        }`}
                        onClick={() =>
                          handleModalPhotoSelect(photo.id, photo.src)
                        }
                      >
                        <Image
                          src={photo.src}
                          alt={
                            activeTab === "Your Photos"
                              ? `My photo ${photo.id}`
                              : `Highlight ${photo.id}`
                          }
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 33vw"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow">
                            <Check
                              size={12}
                              className="text-white"
                              strokeWidth={3}
                            />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-white/20"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download Preview Modal */}
        {showDownloadPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowDownloadPreview(false)} />
            <div className="relative z-50 bg-white rounded-2xl p-4 w-full max-w-lg mx-4">
              <h3 className="text-lg font-medium mb-4">Download Preview</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={photo.src}
                      alt={`Preview ${photo.id}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDownloadPreview(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
                >
                  <Download size={16} className="mr-2" />
                  Download All
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 w-full bg-white z-10 border-t border-gray-100">
          <NavigationBar />
        </div>
      </div>
    </div>
  );
};

export default SocialShare;
