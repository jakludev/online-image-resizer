let images = [];

document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
document.getElementById('downloadBtn').addEventListener('click', downloadGallery);

function handleImageUpload(event) {
    const files = event.target.files;
    const maxWidth = parseInt(document.getElementById('maxWidth').value);
    const maxHeight = parseInt(document.getElementById('maxHeight').value);

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            loadImageWithPreloader(e.target.result, file, maxWidth, maxHeight);
        }
        reader.readAsDataURL(file);
    });
}

function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

async function loadImageWithPreloader(url, file, maxWidth, maxHeight) {
    const preloader = document.getElementById('preloader');
    preloader.style.display = 'flex';

    try {
        const img = await preloadImage(url);
        const resizedImage = resizeImage(img, maxWidth, maxHeight);
        images.push({
            file: file,
            dataUrl: resizedImage,
            order: images.length + 1
        });
        updateImageContainer();
    } catch (error) {
        console.error('Error loading image:', error);
    } finally {
        preloader.style.display = 'none';
    }
}

function resizeImage(img, maxWidth, maxHeight) {
	const canvas = document.createElement("canvas");
	let width = img.width;
	let height = img.height;

	if (width > height) {
		if (width > maxWidth) {
			height *= maxWidth / width;
			width = maxWidth;
		}
	} else {
		if (height > maxHeight) {
			width *= maxHeight / height;
			height = maxHeight;
		}
	}

	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, width, height);

	// Komprese do JPEG s kvalitou 0.8
	return canvas.toDataURL("image/jpeg", 0.9);
}


function updateImageContainer() {
    const container = document.getElementById('image-container');
    container.innerHTML = '';
    images.forEach((image, index) => {
        const img = document.createElement('img');
        img.src = image.dataUrl;
        img.alt = `Image ${index + 1}`;
        img.setAttribute('data-index', index);
        container.appendChild(img);
    });
}

function downloadGallery() {
    const galleryName = sanitizeFileName(document.getElementById('galleryName').value || 'gallery');
    images.forEach((image, index) => {
        setTimeout(() => {
            const originalFileName = sanitizeFileName(image.file.name.replace(/\.[^/.]+$/, ""));
            const extension = image.file.name.split('.').pop().toLowerCase();
            const orderNumber = (index + 1).toString().padStart(3, '0');
            const fileName = `${galleryName}-${originalFileName}-${orderNumber}.jpg`; // ${extension}
            const link = document.createElement('a');
            link.href = image.dataUrl;
            link.download = fileName;
            link.click();
        }, index * 300); // 500ms delay between each download
    });
}

function sanitizeFileName(name) {
    // Replace spaces with hyphens
    let sanitized = name.replace(/\s+/g, '-');
    
    // Remove any character that isn't a letter, number, underscore, or hyphen
    sanitized = sanitized.replace(/[^a-z0-9_-]/gi, '');
    
    // Ensure the name isn't empty after sanitization
    if (sanitized.length === 0) {
        sanitized = 'gallery';
    }
    
    // Trim the name if it's too long (optional, adjust max length as needed)
    const maxLength = 50;
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    // Remove any leading or trailing hyphens
    sanitized = sanitized.replace(/^-+|-+$/g, '');
    
    return sanitized;
}



// Initialize drag and drop
const imageContainer = document.getElementById('image-container');
new Sortable(imageContainer, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: function(evt) {
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;
        const [movedImage] = images.splice(oldIndex, 1);
        images.splice(newIndex, 0, movedImage);
    }
});
