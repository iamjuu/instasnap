"use client";
import React, { useState, useEffect } from "react";
import { EventHeader } from "../components/header";
// Keep image imports if used by EventHeader or NavFooter, otherwise remove
// import { Post1, Post2, Post3 } from '../assets'
import Image from "next/image";
import NavFooter from "../components/navfooter";
import Link from "next/link";
import Masonry from "react-masonry-css"; 
import instance from "../instance";
import Loader from "../components/loader";
import { useDispatch, useSelector } from 'react-redux';
import { setHighlights, setLoading, setError } from '../redux/slices/highlightsSlice';

const Page = () => {
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
          }
        } catch (error) {
          console.error("Error fetching highlights:", error);
          dispatch(setError(error.message));
        }
      }
    };

    fetchHighlights();
  }, [dispatch, limit, skip, highlights.length]);

  // Masonry breakpoint columns
  const breakpointColumnsObj = {
    default: 4, // Default to 4 columns
    1100: 3, // 3 columns for screens >= 1100px
    700: 2,
    500: 2,
  };

  return (
    // Add padding and flex structure for header/footer
    <div className="flex  flex-col justify-center w-full">
      <div className="w-full justify-center p-4 items-center flex">
        <EventHeader name="Highlight" />
      </div>

      <div className="flex flex-col w-full max-w-[768px] mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white shadow-sm w-full">
          <div className="px-4 w-full mx-auto">
            <EventHeader />
          </div>
        </div>

        {/* Scrollable Content Area with Masonry */}
        <div className=" w-full ">
          {loading ? (
            <div className="flex justify-center items-center mt-[-100px]">
              <Loader />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 mt-4">{error}</div>
          ) : (
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="flex p-4  w-full gap-2 md:gap-4"
              columnClassName="bg-clip-padding"
            >
              {/* Map over postData to render items */}
              {highlights.map((post) => (
                <Link
                  key={post.id}
                  href={`/highlight/${post.id}`}
                  className="block relative cursor-pointer group overflow-hidden rounded-lg mb-2 md:mb-4 shadow hover:shadow-md transition-shadow duration-300"
                >
                  <Image
                    src={post.image}
                    alt={`Highlight ${post.id}`}
                    width={300}
                    height={300}
                    className="w-full h-auto object-cover transition-transform duration-300 ease-in-out group-hover:scale-[1.03]"
                    sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
                    priority={post.id <= 8}
                  />
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out" />
                  {/* Date text with improved transition */}
                  <p className="absolute bottom-2 left-2 text-white text-xs font-medium opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out">
                    {post.date}
                  </p>
                </Link>
              ))}
            </Masonry>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 w-full">
          <NavFooter />
        </div>
      </div>
    </div>
  );
};

export default Page;
