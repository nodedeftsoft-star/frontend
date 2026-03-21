export default function Layout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#F0F6FF]">
        <div className=" bg-white w-[80%] sm:w-[554px] p-10 sm:p-20 shadow-lg rounded-[8px] border border-[#E5E8EB]">
          {children}
        </div>
      </div>
    );
  }