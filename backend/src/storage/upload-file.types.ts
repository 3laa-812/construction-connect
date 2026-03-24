/** Multer memory-storage file shape (no @types/multer dependency). */
export type MulterMemoryFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  fieldname: string;
  encoding: string;
  size: number;
};
