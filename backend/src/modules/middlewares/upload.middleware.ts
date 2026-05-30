import multer from "multer"
import path from "path"
import fs from "fs"

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "storage/cover_playlist")

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${req.params.id}${ext}`)
  },
})

export const uploadCoverMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite à 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Seules les images sont autorisées."))
    }
  },
})

export const uploadProxyCsvMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite à 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (
      ext === ".csv" ||
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === ".csv" ||
      file.mimetype === "text/plain"
    ) {
      cb(null, true)
    } else {
      cb(
        new Error("Seuls les fichiers CSV (.csv) sont autorisés.") as any,
        false,
      )
    }
  },
})
