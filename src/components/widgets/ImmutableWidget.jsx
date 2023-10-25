'use client'


export default function ImmutableWidget() {

// Create trade function goes here
  function handleSubmit(){
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

        <details><summary className="cursor-pointer">Id Token</summary> <span className="italic">Id Token goes here</span></details>

        <details><summary className="cursor-pointer">Access Token</summary><span className="italic">Access Token goes here</span></details>

        <details><summary className="cursor-pointer">Refresh Token</summary><span className="italic">Refresh token goes here</span></details>

        <form action="" className="flex gap-2" onSubmit={handleSubmit}>
          <input type="number" placeholder="Enter order number" className='rounded-sm py-1 px-2 placeholder:text-gray-800 placeholder:italic'/>
          <button type="submit" className="rounded-full px-3 py-1 bg-green-400 hover:bg-green-500">Create Trade</button>
        </form>
      </div>
    </div>
  );
}
