import React, { useState, useEffect } from "react";
import { SAPIBase } from "../tools/api";

type ImageItem = { id: string; filename: string };

const ImageFeedPage = () => {
  const [images, setImages] = useState<ImageItem[]>([]);

  const fetchImages = async () => {
    const res = await fetch(SAPIBase + "/images/list");
    const data = await res.json();
    setImages(data);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("image", file);

    await fetch(SAPIBase + "/images/upload", {
      method: "POST",
      body: formData,
    });

    await fetchImages(); // 업로드 후 목록 새로고침
  };

  return (
    <div>
      <h2>Image Feed</h2>

      <input type="file" accept="image/*" onChange={onFileChange} />

      <div>
        {images.map((img) => (
          <div key={img.id}>
            <p>{img.filename}</p>
            <img
              src={SAPIBase + "/images/" + img.id}
              alt={img.filename}
              style={{ maxWidth: "200px" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageFeedPage;