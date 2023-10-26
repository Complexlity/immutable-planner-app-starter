'use client'


export default function ImmutableWidget() {

// Create trade function goes here
  function handleSubmit(e) {
    e.preventDefault()
    return
  }

  return (
    <div style={{ minWidth: 300, maxWidth: 500 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "row",

        }}
      >
        <p style={{
          color: "white",
          fontSize: "24px"
        }}>Immutable</p>
      </div>
      <div
        className="tokens">

      {/* User Data Goes Here */}

     {/* Rpc functions go here */}
      </div>
    </div>
  );
}
