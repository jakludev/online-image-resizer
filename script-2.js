let images = [];

document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
document.getElementById('downloadBtn').addEventListener('click', downloadGallery);

// Add drag and drop event listeners
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    document.getElementById('drop-zone').classList.add('highlight');
}

function unhighlight() {
    document.getElementById('drop-zone').classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    const maxWidth = parseInt(document.getElementById('maxWidth').value);
    const maxHeight = parseInt(document.getElementById('maxHeight').value);

    Array.from(files).forEach(file => {
        // Only process image files
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                loadImageWithPreloader(e.target.result, file, maxWidth, maxHeight);
            }
            reader.readAsDataURL(file);
        }
    });
}

function handleImageUpload(event) {
    const files = event.target.files;
    handleFiles(files);
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
            originalImg: img, // Store the original image object for reprocessing
            order: images.length + 1,
            selected: true // Defaultně je každý nahraný obrázek vybraný
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

    // Check for transparent background or selected color
    const transparentBg = document.getElementById('transparentBgCheckbox').checked;
    if (!transparentBg) {
        const bgColor = document.getElementById('bgColorPicker').value;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    // Use PNG format when transparency is needed, otherwise JPEG with quality 0.9
    if (transparentBg) {
        return canvas.toDataURL("image/png");
    } else {
        return canvas.toDataURL("image/jpeg", 0.9);
    }
}

// Funkce pro aktualizaci pořadí všech obrázků
function updateImagesOrder() {
    images.forEach((image, index) => {
        image.order = index + 1;
    });
}

function updateImageContainer() {
    const container = document.getElementById('image-container');
    container.innerHTML = '';
    updateImagesOrder(); // Aktualizujeme pořadí obrázků při každém překreslení
    
    images.forEach((image, index) => {
        // Vytvořím kontejner pro každý obrázek a jeho ovládací prvky
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'image-wrapper';
        // Přidáme třídu 'selected' pokud je obrázek vybraný
        if (image.selected) {
            imageWrapper.classList.add('selected');
        }
        
        // Vytvořím obrázek
        const img = document.createElement('img');
        img.src = image.dataUrl;
        img.alt = `Image ${index + 1}`;
        img.setAttribute('data-index', index);
        img.setAttribute('data-order', image.order);
        
        // Checkbox pro výběr obrázku - nyní umístěn v horním levém rohu
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'checkbox-wrapper';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'image-checkbox';
        checkbox.checked = image.selected;
        checkbox.title = 'Vybrat pro stažení';
        checkbox.onclick = function(e) {
            e.stopPropagation();
            toggleImageSelection(index);
        };
        
        checkboxWrapper.appendChild(checkbox);
        
        // Vytvořím kontejner pro tlačítka
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'image-buttons';
        
        // Tlačítko pro mazání
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'image-button delete-button';
        deleteBtn.innerHTML = '❌';
        deleteBtn.title = 'Smazat obrázek';
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            deleteImage(index);
        };
        
        // Tlačítko pro stažení
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'image-button download-button';
        downloadBtn.innerHTML = '⬇️';
        downloadBtn.title = 'Stáhnout obrázek';
        downloadBtn.onclick = function(e) {
            e.stopPropagation();
            downloadSingleImage(index);
        };
        
        // Přidám tlačítka do jejich kontejneru
        buttonsContainer.appendChild(deleteBtn);
        buttonsContainer.appendChild(downloadBtn);
        
        // Přidám obrázek, checkbox a tlačítka do obalu
        imageWrapper.appendChild(img);
        imageWrapper.appendChild(checkboxWrapper);
        imageWrapper.appendChild(buttonsContainer);
        
        // Přidám celý obal do hlavního kontejneru
        container.appendChild(imageWrapper);
    });
}

// Funkce pro přepnutí stavu výběru obrázku
function toggleImageSelection(index) {
    if (index >= 0 && index < images.length) {
        images[index].selected = !images[index].selected;
        updateImageContainer(); // Překreslíme kontejner pro aktualizaci vzhledu
    }
}

function deleteImage(index) {
    if (confirm('Opravdu chcete smazat tento obrázek?')) {
        images.splice(index, 1);
        updateImageContainer();
    }
}

function generateFileName(image, index) {
    const galleryName = sanitizeFileName(document.getElementById('galleryName').value || 'gallery');
    const keepOriginalName = document.getElementById('keepOriginalName').checked;
    const orderNumber = image.order.toString().padStart(3, '0');
    const transparentBg = document.getElementById('transparentBgCheckbox').checked;
    const extension = transparentBg ? 'png' : 'jpg';
    
    if (keepOriginalName) {
        const originalFileName = sanitizeFileName(image.file.name.replace(/\.[^/.]+$/, ""));
        return `${galleryName}-${originalFileName}-${orderNumber}.${extension}`;
    } else {
        return `${galleryName}-${orderNumber}.${extension}`;
    }
}

function downloadSingleImage(index) {
    const image = images[index];
    if (!image) return;
    
    const fileName = generateFileName(image, index);
    
    const link = document.createElement('a');
    link.href = image.dataUrl;
    link.download = fileName;
    link.click();
}

function downloadGallery() {
    // Filtrujeme pouze vybrané obrázky
    const selectedImages = images.filter(image => image.selected);
    
    if (selectedImages.length === 0) {
        alert('Není vybrán žádný obrázek pro stažení!');
        return;
    }
    
    selectedImages.forEach((image, index) => {
        setTimeout(() => {
            const fileName = generateFileName(image, images.indexOf(image));
            const link = document.createElement('a');
            link.href = image.dataUrl;
            link.download = fileName;
            link.click();
        }, index * 300); // 300ms delay between each download
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
    handle: 'img', // Přidáme specifikaci, že jen obrázek slouží jako úchyt
    onEnd: function(evt) {
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;
        const [movedImage] = images.splice(oldIndex, 1);
        images.splice(newIndex, 0, movedImage);
        updateImageContainer(); // Obsahuje aktualizaci pořadí
    }
});

// Přidám tlačítka pro hromadný výběr/odznačení všech obrázků
document.addEventListener('DOMContentLoaded', function() {
    const controlPanel = document.querySelector('.control-panel');
    
    const selectButtons = document.createElement('div');
    selectButtons.className = 'select-buttons';
    
    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'btn select-btn';
    selectAllBtn.textContent = 'Vybrat vše';
    selectAllBtn.onclick = selectAllImages;
    
    const deselectAllBtn = document.createElement('button');
    deselectAllBtn.className = 'btn select-btn';
    deselectAllBtn.textContent = 'Odznačit vše';
    deselectAllBtn.onclick = deselectAllImages;
    
    selectButtons.appendChild(selectAllBtn);
    selectButtons.appendChild(deselectAllBtn);
    
    // Vložíme před tlačítko pro stahování
    controlPanel.insertBefore(selectButtons, document.getElementById('downloadBtn'));
    
    // Změníme text tlačítka pro stahování
    document.getElementById('downloadBtn').textContent = 'Stáhnout vybrané obrázky';

    // Add event listener to toggle visibility of the color picker
    const transparentBgCheckbox = document.getElementById('transparentBgCheckbox');
    const bgColorWrapper = document.getElementById('bgColorWrapper');
    const bgColorPicker = document.getElementById('bgColorPicker');
    
    transparentBgCheckbox.addEventListener('change', function() {
        bgColorWrapper.style.display = transparentBgCheckbox.checked ? 'none' : 'block';
        // Reapply settings to all images when transparency changes
        reprocessAllImages();
    });
    
    // Add event listener for color change
    bgColorPicker.addEventListener('input', reprocessAllImages);

    // Info panel toggle
    const hideInfoBtn = document.getElementById('hideInfoBtn');
    const infoPanel = document.querySelector('.info-panel');
    
    // Check if we previously stored the panel state
    const infoPanelHidden = localStorage.getItem('infoPanelHidden') === 'true';
    if (infoPanelHidden) {
        infoPanel.style.display = 'none';
        hideInfoBtn.textContent = 'Zobrazit informace';
    }
    
    hideInfoBtn.addEventListener('click', function() {
        if (infoPanel.style.display === 'none') {
            infoPanel.style.display = 'block';
            hideInfoBtn.textContent = 'Skrýt informace';
            localStorage.setItem('infoPanelHidden', 'false');
        } else {
            infoPanel.style.display = 'none';
            hideInfoBtn.textContent = 'Zobrazit informace';
            localStorage.setItem('infoPanelHidden', 'true');
        }
    });
});

// Function to reprocess all images with current settings
function reprocessAllImages() {
    if (images.length === 0) return;
    
    const maxWidth = parseInt(document.getElementById('maxWidth').value);
    const maxHeight = parseInt(document.getElementById('maxHeight').value);
    
    const preloader = document.getElementById('preloader');
    preloader.style.display = 'flex';
    
    // Process each image with current background settings
    Promise.all(images.map(async (image, index) => {
        // If we have the original image, use it; otherwise reload it
        let img;
        if (image.originalImg) {
            img = image.originalImg;
        } else {
            try {
                img = await preloadImage(image.dataUrl);
            } catch (error) {
                console.error('Error reloading image:', error);
                return;
            }
        }
        
        // Apply current settings to the image
        const resizedImage = resizeImage(img, maxWidth, maxHeight);
        images[index].dataUrl = resizedImage;
    }))
    .then(() => {
        updateImageContainer();
        preloader.style.display = 'none';
    })
    .catch(error => {
        console.error('Error reprocessing images:', error);
        preloader.style.display = 'none';
    });
}

// Funkce pro výběr/odznačení všech obrázků
function selectAllImages() {
    images.forEach(image => image.selected = true);
    updateImageContainer();
}

function deselectAllImages() {
    images.forEach(image => image.selected = false);
    updateImageContainer();
}