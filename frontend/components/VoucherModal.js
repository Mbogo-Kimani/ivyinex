export default function VoucherModal({ open, onClose, onRedeem, portalData }) {
    if (!open) return null;
    return (
      <div className="modal-backdrop">
        <div className="modal">
          <div className="space-between">
            <h3>Redeem Voucher</h3>
            <button className="btn ghost" onClick={onClose}>Close</button>
          </div>
  
          <p className="kv" style={{marginTop:8}}>Enter a voucher code and the system will activate the package on your device (MAC/IP are auto-captured from captive portal).</p>
  
          {/* We reuse CheckoutModal behavior in page-level logic. */}
          <div style={{marginTop:16}}>
            <p className="kv">Open any package card and click "Use Voucher" to redeem for that package.</p>
          </div>
  
          <div style={{marginTop:16}}>
            <button className="btn" onClick={onClose}>Got it</button>
          </div>
        </div>
      </div>
    );
  }
  