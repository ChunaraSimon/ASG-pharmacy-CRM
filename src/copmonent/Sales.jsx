import React from 'react'

const Sales = () => {
  return (
    <div>
      <div className="pt-[100px] bg-black text-center min-h-[100vh]">
        <h1 className="text-6xl font-extrabold text-white">Sales Dashboard</h1>
        <h3 className="text-[#9E9E8B] text-xl font-normal pt-[30px]">
          Manage leads, track conversions, and stay on top of your pipeline.
        </h3>
        <div className="flex flex-col md:flex-row gap-[40px] p-[40px] md:p-[100px] items-center justify-center">
          <div className="bg-[#121212] h-[260px] w-full max-w-[350px] p-[40px] border-2 rounded-[20px] border-[#222222] hover:bg-[#1C1C1C] hover:border-[#892F23] text-left transition">
            <h1 className="text-6xl font-extrabold text-[#401C17]">01</h1>
            <p className="text-xl text-white font-bold pt-[20px]">View Your Pipeline</p>
            <p className="text-medium font-semibold pt-[15px] text-[#9E9E9E]">
              Quickly see active clients, follow ups, and conversion status.
            </p>
          </div>
          <div className="bg-[#121212] h-[260px] w-full max-w-[350px] p-[40px] border-2 rounded-[20px] border-[#222222] hover:bg-[#1C1C1C] hover:border-[#892F23] text-left transition">
            <h1 className="text-6xl font-extrabold text-[#401C17]">02</h1>
            <p className="text-xl text-white font-bold pt-[20px]">Capture Leads Fast</p>
            <p className="text-medium font-semibold pt-[15px] text-[#9E9E9E]">
              Add new opportunities and keep your client list updated effortlessly.
            </p>
          </div>
          <div className="bg-[#121212] h-[260px] w-full max-w-[350px] p-[40px] border-2 rounded-[20px] border-[#222222] hover:bg-[#1C1C1C] hover:border-[#892F23] text-left transition">
            <h1 className="text-6xl font-extrabold text-[#401C17]">03</h1>
            <p className="text-xl text-white font-bold pt-[20px]">Close More Deals</p>
            <p className="text-medium font-semibold pt-[15px] text-[#9E9E9E]">
              Keep track of next steps and move prospects through the funnel.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sales
