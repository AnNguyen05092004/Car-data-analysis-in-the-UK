// LoadingSpinner Component
export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    {/* Container: chiều cao 64 (256px), căn giữa nội dung */}
    
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
    {/* 
      - animate-spin: Animation xoay 360° liên tục (Tailwind CSS)
      - rounded-full: Bo tròn 100% → hình tròn
      - h-16 w-16: Kích thước 64x64px
      - border-b-4: Viền dưới dày 4px
      - border-blue-600: Màu xanh
      → Tạo vòng tròn có 1/4 viền, khi xoay trông như spinner
    */}
  </div>
);