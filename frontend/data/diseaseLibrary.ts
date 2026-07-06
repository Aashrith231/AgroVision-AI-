import { cropFromDisease, displayDiseaseName } from "../utils/disease";

export const trainedClasses = [
  "Apple___Apple_scab",
  "Apple___Black_rot",
  "Apple___Cedar_apple_rust",
  "Apple___healthy",
  "Background_without_leaves",
  "Blueberry___healthy",
  "Cherry___Powdery_mildew",
  "Cherry___healthy",
  "Corn___Cercospora_leaf_spot Gray_leaf_spot",
  "Corn___Common_rust",
  "Corn___Northern_Leaf_Blight",
  "Corn___healthy",
  "Grape___Black_rot",
  "Grape___Esca_(Black_Measles)",
  "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
  "Grape___healthy",
  "Orange___Haunglongbing_(Citrus_greening)",
  "Peach___Bacterial_spot",
  "Peach___healthy",
  "Pepper,_bell___Bacterial_spot",
  "Pepper,_bell___healthy",
  "Potato___Early_blight",
  "Potato___Late_blight",
  "Potato___healthy",
  "Raspberry___healthy",
  "Soybean___healthy",
  "Squash___Powdery_mildew",
  "Strawberry___Leaf_scorch",
  "Strawberry___healthy",
  "Tomato___Bacterial_spot",
  "Tomato___Early_blight",
  "Tomato___Late_blight",
  "Tomato___Leaf_Mold",
  "Tomato___Septoria_leaf_spot",
  "Tomato___Spider_mites Two-spotted_spider_mite",
  "Tomato___healthy"
];

export const diseaseLibrary = trainedClasses.map((id) => {
  const name = displayDiseaseName(id);
  const crop = id === "Background_without_leaves" ? "Background" : cropFromDisease(id);
  const healthy = id.toLowerCase().includes("healthy");
  return {
    id,
    name,
    crop,
    healthy,
    category: healthy ? "Healthy" : crop === "Background" ? "Non-leaf" : "Disease",
    summary: healthy
      ? `${crop} leaves look healthy in this trained class. Keep monitoring and maintain clean field practices.`
      : crop === "Background"
        ? "Used to detect images that do not contain a clear plant leaf."
        : `${name} is one of the trained disease classes supported by RootSage AI.`
  };
});
