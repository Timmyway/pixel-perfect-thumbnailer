
import { ImageEditor } from "@/components/ImageEditor";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Image Thumbnail Generator
          </h1>
          <p className="text-slate-600 text-base">
            Upload, crop, and resize your images with precision
          </p>
        </div>
        <ImageEditor />
      </div>
    </div>
  );
};

export default Index;
