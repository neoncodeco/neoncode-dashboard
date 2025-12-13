"use client";

import { useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";

const banks = [
  {
    name: "Southeast Bank",
    accName: "Soft it bd",
    accNumber: "701413100000440",
    branch: "Pahartali",
    ref: "Soft it Bd",
    logo: "/seb.png",
  },
  {
    name: "The City Bank",
    accName: "Md Maksudur Rahaman",
    accNumber: "2304002358001",
    branch: "Halishahar",
    ref: "MD MAKSUDUR RAHAMAN",
    logo: "/city.png",
  },
];

// ⭐ Upload to imgbb
const uploadToImgbb = async (imageFile) => {
  const apiKey = "fb16587c8cf01ccd11d8eba7fcdb988e";

  const form = new FormData();
  form.append("image", imageFile);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!data.success) throw new Error("Image upload failed!");
  return data.data.url; // final image URL
};

export default function BankPayForm({ token, setMethod }) {
  const [amount, setAmount] = useState("");
  const [trxId, setTrxId] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  const inputStyle =
    "w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-3 bg-white text-gray-800 placeholder-gray-400";
  const labelStyle = "text-sm font-semibold text-gray-700 block mb-1";

  // ⭐ Manual Bank Payment
  const handleManualPayment = async () => {
    if (!amount || !trxId || !screenshot) {
      return Swal.fire("Error", "Please fill all fields", "error");
    }
    if (!token) {
      return Swal.fire("Error", "You must login first", "error");
    }

    try {
      Swal.fire({
        title: "Uploading Screenshot...",
        text: "Please wait...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // 1️⃣ Upload to imgbb
      const screenshotUrl = await uploadToImgbb(screenshot);

      // 2️⃣ Submit to backend
      const res = await fetch("/api/payment/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          trxId,
          screenshotUrl,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        Swal.fire("Success", "Manual payment request submitted", "success");

        setAmount("");
        setTrxId("");
        setScreenshot(null);
        setMethod(null);
      } else {
        Swal.fire("Error", data.error || "Failed to submit request", "error");
      }
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  return (
    <div className="bg-white border border-green-200 p-8 rounded-xl shadow-lg max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-green-600 border-b pb-3 mb-4">
        Manual Bank Transfer Request
      </h2>

      {/* Bank Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Bank Account Details (Transfer To)
        </h3>

        {banks.map((bank, index) => (
          <div
            key={index}
            className="bg-gray-100 p-4 rounded-lg flex items-center space-x-4 border border-gray-200 hover:shadow-md"
          >
            <Image
              src={bank.logo}
              alt={bank.name}
              width={40}
              height={40}
              className="rounded-full border border-gray-300"
            />

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-sm">
              <p className="col-span-2 font-bold text-gray-900">{bank.name}</p>
              <p className="text-gray-600">
                <span className="font-medium">A/C Name:</span> {bank.accName}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">A/C Number:</span>{" "}
                <span className="text-blue-700 font-mono">{bank.accNumber}</span>
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Branch:</span> {bank.branch}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Reference:</span> {bank.ref}
              </p>
            </div>
          </div>
        ))}
      </div>

      <hr className="border-gray-200" />

      {/* Payment Form */}
      <div className="space-y-4">
        <div>
          <label className={labelStyle}>Amount (BDT)</label>
          <input
            type="number"
            className={inputStyle}
            placeholder="Enter the amount transferred"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
          />
        </div>

        <div>
          <label className={labelStyle}>Transaction ID / Slip No.</label>
          <input
            type="text"
            className={inputStyle}
            placeholder="Enter the transaction reference ID"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
          />
        </div>

        <div>
          <label className={labelStyle}>Payment Screenshot (Proof)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshot(e.target.files[0])}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <p className="text-xs text-gray-400 mt-1">
            Upload the screenshot of your successful bank transfer. (Max size: 5MB)
          </p>
        </div>
      </div>

      <button
        onClick={handleManualPayment}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-lg transform hover:scale-[1.01]"
      >
        Submit Payment Request
      </button>

      <button
        className="flex items-center justify-center w-full mt-3 text-sm text-gray-600 hover:text-green-600"
        onClick={() => {
          setMethod(null);
          setAmount("");
          setTrxId("");
          setScreenshot(null);
        }}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Go Back to Selection
      </button>
    </div>
  );
}
