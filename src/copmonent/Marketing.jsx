import React from 'react'

const Marketing = () => {
  return (
    <div>
      <div className="pt-[100px] bg-black text-center min-h-[100vh]">
        <h1 className="text-6xl font-extrabold text-white">How It Works</h1>
        <h3 className="text-[#9E9E8B] text-xl font-normal pt-[30px]">
          Simple, intuitive, and fast. Three steps to your legal documents.
        </h3>
        <div className="flex flex-col md:flex-row gap-[40px] p-[40px] md:p-[100px] items-center justify-center">
          <div className="bg-[#121212] h-[260px] w-full max-w-[350px] p-[40px] border-2 rounded-[20px] border-[#222222] hover:bg-[#1C1C1C] hover:border-[#892F23] text-left transition">
            <h1 className="text-6xl font-extrabold text-[#401C17]">01</h1>
            <p className="text-xl text-white font-bold pt-[20px]">Choose a Document Type</p>
            <p className="text-medium font-semibold pt-[15px] text-[#9E9E9E]">
              Select from NDA, Contract, Privacy<br />Policy, and more
            </p>
          </div>
          <div className="bg-[#121212] h-[260px] w-full max-w-[350px] p-[40px] border-2 rounded-[20px] border-[#222222] hover:bg-[#1C1C1C] hover:border-[#892F23] text-left transition">
            <h1 className="text-6xl font-extrabold text-[#401C17]">02</h1>
            <p className="text-xl text-white font-bold pt-[20px]">Answer Simple Questions</p>
            <p className="text-medium font-semibold pt-[15px] text-[#9E9E9E]">
              Our AI asks just what it needs to know<br />about your business
            </p>
          </div>
          <div className="bg-[#121212] h-[260px] w-full max-w-[350px] p-[40px] border-2 rounded-[20px] border-[#222222] hover:bg-[#1C1C1C] hover:border-[#892F23] text-left transition">
            <h1 className="text-6xl font-extrabold text-[#401C17]">03</h1>
            <p className="text-xl text-white font-bold pt-[20px]">Download or Edit Instantly</p>
            <p className="text-medium font-semibold pt-[15px] text-[#9E9E9E]">
              Get your document ready to use or<br />customize further
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Marketing
