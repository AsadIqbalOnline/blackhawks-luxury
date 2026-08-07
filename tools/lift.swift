// lift.swift — cut the subject out of a photo using Vision's foreground instance mask.
// Same model as Photos' "lift subject". Native, offline, free.
// Build: swiftc -O lift.swift -o lift
// Use:   ./lift in.jpg out.png

import Foundation
import Vision
import CoreImage
import AppKit

func die(_ m: String) -> Never { FileHandle.standardError.write((m + "\n").data(using: .utf8)!); exit(1) }

let args = CommandLine.arguments
guard args.count >= 3 else { die("usage: lift <in> <out.png>") }
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])

guard let src = CIImage(contentsOf: inURL) else { die("cannot read \(args[1])") }

let handler = VNImageRequestHandler(url: inURL, options: [:])
let req = VNGenerateForegroundInstanceMaskRequest()

do { try handler.perform([req]) } catch { die("vision failed: \(error)") }

guard let obs = req.results?.first else { die("NO_SUBJECT") }

// take every instance — a car photographed 3/4 can segment into several
let mask: CVPixelBuffer
do {
    mask = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
} catch { die("mask failed: \(error)") }

let maskImg = CIImage(cvPixelBuffer: mask)

// scale mask to source extent, then use it as alpha
let sx = src.extent.width  / maskImg.extent.width
let sy = src.extent.height / maskImg.extent.height
let scaled = maskImg.transformed(by: CGAffineTransform(scaleX: sx, y: sy))

guard let blend = CIFilter(name: "CIBlendWithMask") else { die("no CIBlendWithMask") }
blend.setValue(src, forKey: kCIInputImageKey)
blend.setValue(CIImage.empty(), forKey: kCIInputBackgroundImageKey)
blend.setValue(scaled, forKey: kCIInputMaskImageKey)

guard let out = blend.outputImage?.cropped(to: src.extent) else { die("blend failed") }

let ctx = CIContext()
guard let cs = CGColorSpace(name: CGColorSpace.sRGB) else { die("no colorspace") }
do {
    try ctx.writePNGRepresentation(of: out, to: outURL, format: .RGBA8, colorSpace: cs)
} catch { die("write failed: \(error)") }

// report coverage so the caller can reject a bad cut instead of shipping it
var covered = 0, total = 0
CVPixelBufferLockBaseAddress(mask, .readOnly)
if let base = CVPixelBufferGetBaseAddress(mask) {
    let w = CVPixelBufferGetWidth(mask), h = CVPixelBufferGetHeight(mask)
    let stride = CVPixelBufferGetBytesPerRow(mask)
    let fmt = CVPixelBufferGetPixelFormatType(mask)
    if fmt == kCVPixelFormatType_OneComponent8 {
        let p = base.assumingMemoryBound(to: UInt8.self)
        for y in 0..<h { for x in 0..<w {
            total += 1; if p[y*stride + x] > 127 { covered += 1 } } }
    }
}
CVPixelBufferUnlockBaseAddress(mask, .readOnly)
let pct = total > 0 ? Double(covered)/Double(total)*100 : -1
print(String(format: "OK instances=%d coverage=%.1f%%", obs.allInstances.count, pct))
