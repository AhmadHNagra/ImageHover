let settings = {
  autoplayVideos: true,
  muteVideos: true,
  cursorOffset: 10,
  previewDelay: 0,
};

chrome.storage.sync.get(
  {
    autoplayVideos: true,
    muteVideos: true,
    cursorOffset: 10,
    previewDelay: 0,
  },
  (loadedSettings) => {
    settings = loadedSettings;
  }
);

const style = document.createElement("style");
style.textContent = `
  .hover-preview {
    position: fixed;
    z-index: 10000;
    background: rgba(0, 0, 0, 0.8);
    padding: 5px;
    border-radius: 4px;
    max-width: 500px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    align-items: center;
  }

  .hover-preview::before {
    content: '';
    position: fixed;
    left: var(--cursor-x, 0);
    top: var(--cursor-y, 0);
    width: 100px;
    height: 100px;
    transform: translate(-50%, -50%);
    z-index: 9999;
  }

  .hover-preview img,
  .hover-preview video {
    max-width: 100%;
    max-height: 80vh;
    display: block;
    object-fit: contain;
    width: auto;
    height: auto;
  }

  .preview-counter {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 3px;
    font-size: 14px;
    z-index: 1000;
  }

  .preview-loader {
    width: 48px;
    height: 48px;
    border: 5px solid #FFF;
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }

  .preview-loader.error {
    border-color: #ff4444;
    border-bottom-color: transparent;
    animation: none;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .preview-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;
document.head.appendChild(style);

const preview = document.createElement("div");
preview.className = "hover-preview";
document.body.appendChild(preview);

window.addEventListener("beforeunload", () => {
  hidePreview();
  preview.remove();
});

document.addEventListener("mousemove", (e) => {
  if (
    preview.style.display === "none" ||
    isPreviewFrozen ||
    e.target.closest("a") !== currentLink
  ) {
    return;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const previewRect = preview.getBoundingClientRect();
  const previewWidth = previewRect.width;
  const previewHeight = previewRect.height;

  let left = e.clientX + settings.cursorOffset;
  let top = e.clientY + settings.cursorOffset;

  if (left + previewWidth > viewportWidth) {
    left = e.clientX - previewWidth - settings.cursorOffset;
  }

  if (top + previewHeight > viewportHeight) {
    top = e.clientY - previewHeight - settings.cursorOffset;
  }

  left = Math.max(0, left);
  top = Math.max(0, top) - 100;

  preview.style.setProperty("--cursor-x", `${e.clientX}px`);
  preview.style.setProperty("--cursor-y", `${e.clientY}px`);
  preview.style.left = `${left}px`;
  preview.style.top = `${top}px`;
});

let currentLink = null;
let currentImageIndex = 0;
let currentImages = [];

let previewTimeout = null;
document.addEventListener("mouseover", (e) => {
  const target = e.target.closest("a");
  if (!target) return;

  const url = target.href;
  if (!url) return;

  if (previewTimeout) {
    clearTimeout(previewTimeout);
  }

  currentImageIndex = 0;
  currentImages = [];

  if (isMediaURL(url)) {
    currentLink = target;
    const imageUrls = target.dataset.images
      ? JSON.parse(target.dataset.images)
      : [url];
    currentImages = imageUrls;

    if (settings.previewDelay > 0) {
      previewTimeout = setTimeout(() => {
        showPreview(imageUrls[0]);
      }, settings.previewDelay);
    } else {
      showPreview(imageUrls[0]);
    }
  }
});

document.addEventListener("mouseout", (e) => {
  if (isPreviewFrozen) return;
  if (!e.relatedTarget || !e.relatedTarget.closest(".hover-preview")) {
    hidePreview();
  }
});

preview.addEventListener("wheel", (e) => {
  e.preventDefault();
  if (currentImages.length <= 1) return;

  if (e.deltaY > 0) {
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
  } else {
    currentImageIndex =
      (currentImageIndex - 1 + currentImages.length) % currentImages.length;
  }
  showPreview(currentImages[currentImageIndex]);
});

function isMediaURL(url) {
  return (
    /\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i.test(url) ||
    /v\.redd\.it/.test(url) ||
    /imgur\.com/.test(url)
  );
}

async function showPreview(url) {
  if (!preview) return;
  preview.innerHTML = "";

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "preview-content";

  if (preview.isConnected) {
    preview.appendChild(contentWrapper);
  } else {
    return;
  }

  const loader = document.createElement("div");
  loader.className = "preview-loader";
  contentWrapper.appendChild(loader);
  preview.style.display = "block";

  if (url && url.includes("imgur.com") && currentImages.length <= 1) {
    let imgurId;

    if (url && url.includes("/a/")) {
      imgurId = url.split("/a/")[1].split(/[?#]/)[0];

      try {
        let response = await fetch(`https://api.imgur.com/3/album/${imgurId}`, {
          headers: {
            Authorization: "Client-ID ac8691db51488b0",
          },
        });
        let data = await response.json();

        if (data.success && data.data && data.data.images) {
          currentImages = data.data.images.map((img) => img.link);
          if (currentImages.length > 0) {
            displayMedia(
              currentImages[currentImageIndex],
              contentWrapper,
              loader
            );
            return;
          }
        } else {
          response = await fetch(
            `https://api.imgur.com/3/gallery/album/${imgurId}`,
            {
              headers: {
                Authorization: "Client-ID ac8691db51488b0",
              },
            }
          );
          data = await response.json();

          if (data.success && data.data && data.data.images) {
            currentImages = data.data.images.map((img) => img.link);
            if (currentImages.length > 0) {
              displayMedia(
                currentImages[currentImageIndex],
                contentWrapper,
                loader
              );
              return;
            }
          }
        }
      } catch (error) {
        loader.classList.add("error");
        setTimeout(hidePreview, 1000);
        return;
      }
    } else {
      const match = url.match(/imgur\.com\/(?:a\/|gallery\/)?([a-zA-Z0-9]+)/);
      if (match) {
        imgurId = match[1];
        if (!url.startsWith("https://i.imgur.com")) {
          url = `https://i.imgur.com/${imgurId}.jpg`;
        }
        currentImages = [url];
      }
    }
  }

  const displayUrl =
    currentImages.length > 0 ? currentImages[currentImageIndex] : url;
  displayMedia(displayUrl, contentWrapper, loader);
}

function displayMedia(url, contentWrapper, loader) {
  if (currentImages.length > 1) {
    const counter = document.createElement("div");
    counter.className = "preview-counter";
    counter.textContent = `${currentImageIndex + 1}/${currentImages.length}`;
    contentWrapper.appendChild(counter);
  }

  if (url && url.includes("v.redd.it")) {
    const video = document.createElement("video");
    const qualities = ["1080", "720", "480", "360", "240"];
    let qualityIndex = 0;

    const tryNextQuality = () => {
      if (qualityIndex >= qualities.length) {
        video.src = `${url}/HLSPlaylist.m3u8`;
        video.onerror = () => {
          loader.classList.add("error");
          setTimeout(hidePreview, 1000);
        };
        return;
      }

      video.src = `${url}/DASH_${qualities[qualityIndex]}.mp4`;
      video.onerror = () => {
        qualityIndex++;
        tryNextQuality();
      };
    };

    video.autoplay = settings.autoplayVideos;
    video.muted = settings.muteVideos;
    video.loop = true;
    video.controls = true;
    video.style.maxHeight = "80vh";
    video.onloadeddata = () => {
      const counter = contentWrapper.querySelector(".preview-counter");
      contentWrapper.innerHTML = "";
      if (counter) contentWrapper.appendChild(counter);
      contentWrapper.appendChild(video);
    };

    tryNextQuality();
  } else if (/\.(mp4|webm)$/i.test(url)) {
    const video = document.createElement("video");
    video.src = url;
    video.autoplay = settings.autoplayVideos;
    video.muted = settings.muteVideos;
    video.loop = true;
    video.onloadeddata = () => {
      const counter = contentWrapper.querySelector(".preview-counter");
      contentWrapper.innerHTML = "";
      if (counter) contentWrapper.appendChild(counter);
      contentWrapper.appendChild(video);
    };
    video.onerror = () => {
      loader.classList.add("error");
      setTimeout(hidePreview, 1000);
    };
  } else {
    const img = document.createElement("img");
    img.src = url;
    img.onload = () => {
      const counter = contentWrapper.querySelector(".preview-counter");
      contentWrapper.innerHTML = "";
      if (counter) contentWrapper.appendChild(counter);
      contentWrapper.appendChild(img);
    };
    img.onerror = () => {
      loader.classList.add("error");
      setTimeout(hidePreview, 1000);
    };
  }
}

function hidePreview() {
  if (isPreviewFrozen) return;
  preview.style.display = "none";
  preview.innerHTML = "";
  preview.style.left = "0";
  preview.style.top = "0";
}

let isPreviewFrozen = false;

preview.addEventListener("mousedown", (e) => {
  if (e.button === 1) {
    e.preventDefault();
    isPreviewFrozen = !isPreviewFrozen;
  }
});

document.addEventListener("click", (e) => {
  if (isPreviewFrozen && !preview.contains(e.target)) {
    isPreviewFrozen = false;
    hidePreview();
  }
});

document.addEventListener("keydown", (e) => {
  if (preview.style.display !== "block" || currentImages.length <= 1) return;

  switch (e.key) {
    case "ArrowRight":
    case "ArrowDown":
      currentImageIndex = (currentImageIndex + 1) % currentImages.length;
      showPreview(currentImages[currentImageIndex]);
      break;
    case "ArrowLeft":
    case "ArrowUp":
      currentImageIndex =
        (currentImageIndex - 1 + currentImages.length) % currentImages.length;
      showPreview(currentImages[currentImageIndex]);
      break;
  }
});

let touchStartX = 0;
let touchStartY = 0;

preview.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

preview.addEventListener("touchmove", (e) => {
  if (currentImages.length <= 1) return;
  e.preventDefault();
});

preview.addEventListener("touchend", (e) => {
  if (currentImages.length <= 1) return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  const minSwipeDistance = 50;

  if (
    Math.abs(deltaX) > Math.abs(deltaY) &&
    Math.abs(deltaX) > minSwipeDistance
  ) {
    if (deltaX > 0) {
      currentImageIndex =
        (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    } else {
      currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    }
    showPreview(currentImages[currentImageIndex]);
  }
});

window.addEventListener("beforeunload", cleanupPreview);
window.addEventListener("popstate", cleanupPreview);

const urlObserver = new MutationObserver((mutations) => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    cleanupPreview();
  }
});

let lastUrl = location.href;
urlObserver.observe(document.querySelector("head"), {
  childList: true,
  subtree: true,
});

function cleanupPreview() {
  hidePreview();
  preview.remove();
  currentLink = null;
  currentImageIndex = 0;
  currentImages = [];
  isPreviewFrozen = false;
  if (previewTimeout) {
    clearTimeout(previewTimeout);
    previewTimeout = null;
  }

  document.body.appendChild(preview);
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", cleanupPreview);
} else {
  cleanupPreview();
}
