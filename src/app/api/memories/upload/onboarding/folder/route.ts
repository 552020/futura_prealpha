import { NextRequest, NextResponse } from "next/server";
import {
  parseMultipleFiles,
  logMultipleFileDetails,
  validateFileType,
  validateFileWithErrorHandling,
  uploadFileToStorageWithErrorHandling,
  createTemporaryUserWithErrorHandling,
  storeFileInDatabaseWithErrorHandling,
} from "../../utils";
import { isAcceptedMimeType, validateFile, uploadFileToStorage, getMemoryType, storeInDatabase } from "../../utils";
import { createTemporaryUserBase } from "../../../../utils";

/**
 * Folder Upload Endpoint
 *
 * **Key Differences from File Upload:**
 * 1. Receives multiple files from a single folder upload
 * 2. Creates ONE temporary user for ALL files in the folder
 * 3. Processes files in parallel for better performance
 * 4. Returns array of results instead of single result
 * 5. Handles folder structure/paths
 *
 * **Request Format:**
 * - Content-Type: multipart/form-data
 * - Body: Multiple files from folder selection
 *
 * **Response Format:**
 * {
 *   results: Array<{ id: string, ownerId: string, fileName: string }>,
 *   totalFiles: number,
 *   successfulUploads: number,
 *   failedUploads: number
 * }
 */

export async function POST(request: NextRequest) {
  console.log("🚀 Starting onboarding folder upload process...");

  try {
    // Parse form data and extract files
    const { files, error } = await parseMultipleFiles(request);
    if (error) return error;
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    logMultipleFileDetails(files);

    // Validate file types for all files
    for (const file of files) {
      const fileTypeError = validateFileType(file, isAcceptedMimeType);
      if (fileTypeError) return fileTypeError;
    }

    // Create one temporary user for all files
    const { allUser, error: userError } = await createTemporaryUserWithErrorHandling(createTemporaryUserBase);
    if (userError) return userError;

    // Validate and upload each file
    const uploadResults = [];
    for (const file of files) {
      // Validate file
      const { validationResult, error: validationError } = await validateFileWithErrorHandling(file, validateFile);
      if (validationError) {
        console.error(`❌ Validation failed for ${file.name}:`, validationError);
        continue; // Skip this file and continue with others
      }

      // Upload file to storage
      const { url, error: uploadError } = await uploadFileToStorageWithErrorHandling(
        file,
        validationResult!.buffer!,
        uploadFileToStorage
      );
      if (uploadError) {
        console.error(`❌ Upload failed for ${file.name}:`, uploadError);
        continue; // Skip this file and continue with others
      }

      // Store in database
      const { result, error: dbError } = await storeFileInDatabaseWithErrorHandling(
        file,
        url,
        allUser.id,
        getMemoryType,
        storeInDatabase
      );
      if (dbError) {
        console.error(`❌ Database storage failed for ${file.name}:`, dbError);
        continue; // Skip this file and continue with others
      }

      uploadResults.push({
        fileName: file.name,
        url,
        success: true,
        userId: allUser.id,
        memoryId: result!.data.id, // Add memory ID to results
      });
    }

    return NextResponse.json({
      message: "Folder upload endpoint - validation and upload completed",
      status: "partial_implementation",
      totalFiles: files.length,
      successfulUploads: uploadResults.length,
      failedUploads: files.length - uploadResults.length,
      results: uploadResults,
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
