export default function PaymentSection() {
  const downloadQR = async () => {
    const img = document.getElementById("qrCode");
    const res = await fetch(img.src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "dzynsbysoham_UPI_QR.png";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <section className="section payment">
      <h2 className="section-title">Payment Details</h2>

      <div className="qr-container">
        <img id="qrCode" src="/Images/pay.png" className="qr-code" />
      </div>

      <p className="payment-instruction">Scan to pay via UPI</p>
      <button className="button" onClick={downloadQR}>
        Download QR
      </button>
    </section>
  );
}
