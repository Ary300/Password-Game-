export function downloadText(theFileName: string, theText: string, theMime: string): void {
  const theBlob = new Blob([theText], { type: theMime })
  const theUrl = URL.createObjectURL(theBlob)
  const theLink = document.createElement('a')
  theLink.href = theUrl
  theLink.download = theFileName
  document.body.appendChild(theLink)
  theLink.click()
  theLink.remove()
  URL.revokeObjectURL(theUrl)
}
