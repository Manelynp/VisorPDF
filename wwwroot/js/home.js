
//-----------------------------------------------------
// 1. GLOBAL REFERENCES
//-----------------------------------------------------
const iframe = document.getElementById("pdfViewer");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const resetBtn = document.getElementById("resetBtn");
const saveBtn = document.getElementById("saveBtn");

const openFirmaBtn = document.getElementById("openFirmaBtn");
const btnRestablecer = document.getElementById("btnRestablecer");
const btnFirmar = document.getElementById("btnFirmar");
const btnOkFirma = document.getElementById("btnOkFirma");
const btnCancelarFirma = document.getElementById("btnCancelarFirma");
const togglePenColor = document.getElementById("togglePenColor");

const canvas = document.getElementById("canvas");


const ctx = canvas.getContext("2d");
const firmaPreviewImg = document.getElementById("firmaPreviewImg");

const modalFirmar = new bootstrap.Modal(
    document.getElementById("modalFirmar")
);

const modalConfirmacionFirma = new bootstrap.Modal(
    document.getElementById("modalConfirmacionFirma")
);

let app = null;
let annotationStorage = null;

let fp = false; // edit mode (firma permitida)
let dibujando = false;
let firmaBase64 = "";
let currentPenColor = "black";
let hasChanges = false;

//-----------------------------------------------------
// 2. CONNECT TO PDF.JS VIEWER
//-----------------------------------------------------
iframe.addEventListener("load", () => {
    app = iframe.contentWindow.PDFViewerApplication;

    if (!app) return;

    //PDF.js annotationStorage
    app.eventBus.on("documentloaded", () => {
        if (!app.pdfDocument) return;

        annotationStorage = app.pdfDocument.annotationStorage;
        //console.log("PDF document ready");

        // 👇 THIS detects any change (form, ink, etc.)
        annotationStorage.onSetModified = () => {
            hasChanges = true;
            console.log("Document modified");
        };

        customizePdfToolbar();

        const interval = setInterval(() => {
            if (!iframe.contentDocument) return;
            customizePdfToolbar();
        }, 500);

        // stop after 3 seconds
        setTimeout(() => clearInterval(interval), 3000);
    });
});

//-----------------------------------------------------
// WARN BEFORE LEAVING WITH UNSAVED CHANGES
//-----------------------------------------------------
window.addEventListener("beforeunload", function (e) {
    if (!hasChanges) return;

    e.preventDefault();
    e.returnValue = "";
});


async function guardarDocumento() {
    const datos = await readForm();

    if (!datos) {
        console.warn("PDF is not ready yet.");
        return;
    }

    console.log("FORM DATA:", datos);

    //-------------------------------------------------
    // SEND TO BACKEND HERE
    //-------------------------------------------------

    fp = false;

    window.history.replaceState({}, "", "?fp=false");

    actualizaEstadoBotonFirmar();

    if (app && app.pdfDocument) {
        app.pdfDocument.annotationStorage.resetModified();
    }

    hasChanges = false;

    console.log("Document data processed and locked.");
}

//-----------------------------------------------------
// 3. READ FORM DATA -> JSON
//-----------------------------------------------------
async function readForm() {
    if (!app || !app.pdfDocument) return;

    const pdfDoc = app.pdfDocument;
    const fields = await pdfDoc.getFieldObjects();
    const storage = pdfDoc.annotationStorage;

    const annotations = storage.serializable.map;
    console.log("ANNOTATIONS:", annotations);

    const datos = [];

    for (const [fieldName, fieldInstances] of Object.entries(fields)) {

        // Ignore buttons or fields we don't want in the saved JSON ('Reset Button' in the Form.pdf file)
        if (fieldName.toLowerCase() === "resetbutton") {
            continue;
        }

        let valor = "";

        //-------------------------------------------------
        // GROUP FIELDS (radio groups / grouped widgets)
        //-------------------------------------------------
        if (fieldInstances.length > 1) {
            let selectedField = null;

            // find selected item in the group
            for (const field of fieldInstances) {
                const stored = storage.getValue(field.id, { value: null });

                if (stored && stored.value === true) {
                    selectedField = field;
                    break;
                }
            }

            if (selectedField) {
                const selectedInput = iframe.contentDocument.getElementById(selectedField.id);

                if (selectedInput) {
                    const labelText = getRadioLabelText(selectedInput);

                    valor = labelText || getExportValue(selectedField);
                } else {
                    valor = getExportValue(selectedField);
                }

            } else {
                valor = "";
            }

        }

        //-------------------------------------------------
        // SINGLE FIELD
        //-------------------------------------------------
        else {
            const field = fieldInstances[0];
            const stored = storage.getValue(field.id, { value: "" });

            valor = stored?.value ?? "";

            if (typeof valor === "boolean") {
                valor = valor ? "Yes" : "";
            }
        }

        datos.push({
            nombre: fieldName,
            valor: valor
        });

    }

    //-------------------------------------------------
    // ADD SIGNATURE IF EXISTS
    //-------------------------------------------------
    if (firmaBase64) {
        datos.push({
            nombre: "signature button",
            valor: firmaBase64
        });
    }

    console.log("ALL FORM DATA:", datos);

    ///------------------------------------------------
    // ADD INK AS BASE64 IMAGE
    //-------------------------------------------------
    if (annotations && annotations.size > 0) {
        const inkData = [];

        annotations.forEach((value, key) => {
            if (value && value.annotationType === 15) {
                inkData.push({
                    id: key,
                    data: value
                });
            }
        });

        if (inkData.length > 0) {
            const base64Ink = convertirInkABase64(inkData);

            datos.push({
                nombre: "editorInkButton",
                valor: {
                    raw: inkData,
                    image: base64Ink
                }

            });
        }
    }

    return datos;
}

//-----------------------------------------------------
//Helper functions
//------------------------------------------------------
function getExportValue(field) {
    return String(
        field.exportValue ??
        field.exportValues ??
        field.value ??
        "Yes"
    );
}

function getRadioLabelText(input) {
    if (!input) return "";

    // 1. text in the same parent
    const parent = input.parentElement;
    if (parent) {
        const parentText = parent.textContent.replace(/\s+/g, " ").trim();
        if (parentText) {
            const inputValue = input.value ? String(input.value).trim() : "";
            let cleaned = parentText;

            if (inputValue && cleaned === inputValue) {
                cleaned = "";
            }

            if (cleaned) return cleaned;
        }
    }

    // 2. label[for=id]
    if (input.id) {
        const explicitLabel = iframe.contentDocument.querySelector(`label[for="${input.id}"]`);
        if (explicitLabel) {
            const text = explicitLabel.textContent.replace(/\s+/g, " ").trim();
            if (text) return text;
        }
    }

    // 3. nearest label wrapper
    const closestLabel = input.closest("label");
    if (closestLabel) {
        const text = closestLabel.textContent.replace(/\s+/g, " ").trim();
        if (text) return text;
    }

    // 4. next sibling text
    let node = input.nextSibling;
    while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.replace(/\s+/g, " ").trim();
            if (text) return text;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const text = node.textContent.replace(/\s+/g, " ").trim();
            if (text) return text;
        }

        node = node.nextSibling;
    }

    return "";
}

function convertirInkABase64(inkAnnotations) {
    const canvasTemp = document.createElement("canvas");
    const ctxTemp = canvasTemp.getContext("2d");

    canvasTemp.width = 500;
    canvasTemp.height = 200;

    ctxTemp.fillStyle = "white";
    ctxTemp.fillRect(0, 0, canvasTemp.width, canvasTemp.height);

    ctxTemp.strokeStyle = "black";
    ctxTemp.lineWidth = 2;
    ctxTemp.lineCap = "round";

    inkAnnotations.forEach(ink => {
        const paths = ink.data.paths;

        if (!paths || !Array.isArray(paths)) return; // ✅ prevent error

        paths.forEach(path => {
            if (!Array.isArray(path)) return;

            ctxTemp.beginPath();

            for (let i = 0; i < path.length; i += 2) {
                const x = path[i];
                const y = path[i + 1];

                if (i === 0) {
                    ctxTemp.moveTo(x, y);
                } else {
                    ctxTemp.lineTo(x, y);
                }
            }

            ctxTemp.stroke();
        });
    });

    return canvasTemp.toDataURL("image/png").split(",")[1];
}

//-----------------------------------------------------
// 4. RESET / CLEAR FORM
//-----------------------------------------------------
function resetForm() {

    if (!app || !app.pdfDocument || !annotationStorage) return;

    //-------------------------------------------------
    // CLEAR STORAGE
    //-------------------------------------------------
    const ids = Array.from(annotationStorage.serializable.map.keys());

    ids.forEach(id => {
        annotationStorage.remove(id);
    });

    //-------------------------------------------------
    // CLEAR HTML INPUTS
    //-------------------------------------------------
    const inputs = iframe.contentDocument.querySelectorAll("input, textarea, select");

    inputs.forEach(el => {
        if (el.type === "checkbox" || el.type === "radio") {
            el.checked = false;
        } else {
            el.value = "";
        }
    });

    //-------------------------------------------------
    // RESET STATES
    //-------------------------------------------------

    resetSignature();

    //-------------------------------------------------
    // IMPORTANT: reset change tracking
    //-------------------------------------------------
    hasChanges = false;

    //-------------------------------------------------
    // 🔥 RELOAD PDF (THIS IS THE KEY)
    //-------------------------------------------------
    const currentUrl = iframe.src;
    iframe.src = currentUrl;

    console.log("Everything cleared (PDF reloaded)");
}

//-----------------------------------------------------
// 5. UPLOAD NEW PDF FILE
//-----------------------------------------------------
uploadBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    //-------------------------------------------------
    // ⚠️ CHECK UNSAVED CHANGES
    //-------------------------------------------------
    if (hasChanges) {
        const confirmChange = confirm(
            "Tienes cambios sin guardar. ¿Quieres continuar sin guardar?"
        );

        if (!confirmChange) {
            fileInput.value = ""; // reset input
            return;
        }
    }

    //-------------------------------------------------
    // CLEAN STATE
    //-------------------------------------------------
    hasChanges = false;
    resetSignature();

    // 🛑 prevent "save changes" alert
    if (app && app.pdfDocument) {
        app.pdfDocument.annotationStorage.resetModified();
    }

    //-------------------------------------------------
    // ACTIVATE EDIT MODE
    //-------------------------------------------------
    fp = true;

    // Update URL WITHOUT reloading page
    const newUrl = window.location.pathname + "?fp=true";
    window.history.replaceState({}, "", newUrl);

    actualizaEstadoBotonFirmar();

    //-------------------------------------------------
    // LOAD FILE
    //-------------------------------------------------
    const url = URL.createObjectURL(file);
    iframe.src = "/lib/pdfjs/web/viewer.html?file=" + encodeURIComponent(url);

    console.log("PDF loaded:", file.name);


});

//-----------------------------------------------------
// 6. BUTTON EVENTS
//-----------------------------------------------------
resetBtn.addEventListener("click", resetForm);
saveBtn.addEventListener("click", guardarDocumento);


//-----------------------------------------------------
// PDF.JS TOOLBAR CUSTOMIZATION
//-----------------------------------------------------
function customizePdfToolbar() {
    if (!iframe.contentDocument) return;

    const doc = iframe.contentDocument;

    // Always hidden
    [
        // left side----------
        "sidebarToggleButton",
        "viewFindButton",
        "previous",
        "next",

        // editor tools-------
        "editorFreeText",
        //"editorInk",
        "editorStamp",
        "editorHighlight",
        //"editorModeButtons",
        "editorModeSeparator",

        // right side---------
        //"printButton",
        "downloadButton",
        "secondaryToolbarToggle",

        // optional extras-----
        "openFile",
        "cursorSelectTool",
        "cursorHandTool"
    ].forEach(id => hideById(doc, id));

    // Show or hide depending on fp----
    toggleById(doc, "editorInk", fp);
    toggleById(doc, "printButton", fp);
    toggleById(doc, "editorModeButtons", fp);


}

//Helper
function toggleById(doc, id, show) {
    const el = doc.getElementById(id);
    if (el) {
        el.style.display = show ? "" : "none";
    }
}

function hideById(doc, id) {
    const el = doc.getElementById(id);
    if (el) {
        el.style.display = "none";
    }
}

//----------------------------------------------------
// Hide Firmar button when already signed
//----------------------------------------------------

function leerUrl() {
    const params = new URLSearchParams(window.location.search);

    if (params.has("fp")) {
        fp = params.get("fp") === "true";
    } else {
        fp = true; // default if not specified
    }

}

function actualizaEstadoBotonFirmar() {
    if (!openFirmaBtn) return;

    // Show / hide button-----
    openFirmaBtn.style.display = fp ? "inline-block" : "none";

    // ALSO update PDF toolbar--------
    if (iframe.contentDocument) {
        customizePdfToolbar();

        setTimeout(customizePdfToolbar, 300);
    }

}

leerUrl(); // reads ?fp=true
actualizaEstadoBotonFirmar();



//-----------------------------------------------------
// 7. SIGNATURE SYSTEM (CANVAS)
//-----------------------------------------------------
function prepararCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = currentPenColor;

    updatePenToggleButton();
}

function updatePenToggleButton() {
    if (currentPenColor === "black") {
        togglePenColor.style.background = "black";
        togglePenColor.style.border = "2px solid #6c757d";
    } else {
        togglePenColor.style.background = "#0d6efd";
        togglePenColor.style.border = "2px solid #6c757d";
    }
}

function togglePenColorMode() {
    currentPenColor = currentPenColor === "black" ? "blue" : "black";
    ctx.strokeStyle = currentPenColor;
    updatePenToggleButton();
}

// Open modal
openFirmaBtn.addEventListener("click", () => {
    currentPenColor = "black";
    modalFirmar.show();

    setTimeout(() => {
        prepararCanvas();
    }, 200);
});

// Toggle color button
togglePenColor.addEventListener("click", () => {
    togglePenColorMode();
});

// Mouse
canvas.addEventListener("mousedown", e => {
    dibujando = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", e => {
    if (!dibujando) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
});

window.addEventListener("mouseup", () => {
    dibujando = false;
});

// Touch
canvas.addEventListener("touchstart", e => {
    e.preventDefault();

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();

    dibujando = true;
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
});

canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!dibujando) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
});

window.addEventListener("touchend", () => {
    dibujando = false;
});

// Clear signature
btnRestablecer.addEventListener("click", () => {
    prepararCanvas();
});

// Save signature
btnFirmar.addEventListener("click", () => {
    const fullBase64 = canvas.toDataURL("image/png");
    firmaBase64 = fullBase64.split(",")[1];

    firmaPreviewImg.src = "data:image/png;base64," + firmaBase64;

    hasChanges = true;

    const modalElement = document.getElementById("modalFirmar");

    modalElement.addEventListener(
        "hidden.bs.modal",
        () => {
            modalConfirmacionFirma.show();
        },
        { once: true }
    );

    modalFirmar.hide();
});

// Confirm signature
btnOkFirma.addEventListener("click", () => {
    modalConfirmacionFirma.hide();
});


function resetSignature() {
    firmaBase64 = "";
    firmaPreviewImg.src = "";
    currentPenColor = "black";
    prepararCanvas();
}



