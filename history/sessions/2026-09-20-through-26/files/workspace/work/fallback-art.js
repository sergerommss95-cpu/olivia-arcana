function updateFallbackArt(r){
 const motifs=[
  '<path d="M39 119a56 56 0 0 1 112 0M39 197v-16h21v-16h21v-16h21v-16h21v-16h28v80Z"/>',
  '<path d="M100 47v174M100 96l43 43-43 43-43-43ZM100 107l32 32-32 32-32-32Z"/>',
  '<path d="M45 205V104a55 55 0 0 1 110 0v101h-15V105a40 40 0 0 0-80 0v100ZM79 205V105a21 21 0 0 1 42 0v100M100 98v89"/>',
  '<path fill="currentColor" fill-opacity=".12" d="M137 61c-64-22-116 38-88 95 19 39 60 41 88 22-65 8-81-88 0-117Z"/>',
  '<path fill="currentColor" fill-opacity=".16" d="m100 49 11 69 42-27-29 42 54 11-55 11 29 43-42-29-10 63-11-63-42 29 28-43-53-11 53-11-28-42 43 28Z"/>',
  '<circle cx="100" cy="134" r="30" fill="currentColor" fill-opacity=".17"/>'+Array.from({length:16},(_,i)=>`<path d="M96 57h8v33h-8Z" transform="rotate(${i*22.5} 100 134)"/>`).join(''),
  '<path d="M143 201c63-118-4-193-61-144-52 46-45 126-15 153M132 189c43-95-7-151-44-118-40 35-37 92-12 129M121 177c28-71-8-109-27-90-28 29-29 68-9 101"/>'
 ];
 $('fallback-art').innerHTML=`<svg viewBox="0 0 200 300" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M20 41V20h21m118 0h21v21M20 259v21h21m118 0h21v-21"/><text x="100" y="31" text-anchor="middle" font-family="Cormorant Garamond" font-size="12" stroke="none" fill="currentColor">${r[0]}</text>${motifs[r[4]]}<path d="M61 240h78"/><text x="100" y="269" text-anchor="middle" font-family="DM Sans" font-size="8" stroke="none" fill="currentColor">${r[1].toUpperCase()}</text></svg>`;
}
