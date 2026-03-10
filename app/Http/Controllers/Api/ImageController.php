<?php

namespace App\Http\Controllers\Api;

use App\Models\Image;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ImageController extends ApiController
{
    /**
     * Upload an image for notes.
     */
    public function upload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            'note_id' => 'nullable|integer|exists:notes,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        try {
            $file = $request->file('image');
            $userId = Auth::id();
            $disk = $this->storageDisk();

            // Generate unique filename
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = "images/notes/{$userId}/{$filename}";

            // Store the file
            Storage::disk($disk)->put($path, file_get_contents($file));

            // Create image record
            $image = Image::create([
                'user_id' => $userId,
                'filename' => $file->getClientOriginalName(),
                'path' => $path,
                'disk' => $disk,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'note_id' => $request->note_id,
            ]);

            // Generate URL
            $url = Storage::disk($disk)->url($path);

            return $this->success([
                'image' => [
                    'id' => $image->id,
                    'url' => $url,
                    'filename' => $image->filename,
                    'size' => $image->size,
                ],
            ], 'Image uploaded successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to upload image: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Delete an image.
     */
    public function delete(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:images,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $image = Image::where('id', $request->id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$image) {
            return $this->notFound('Image not found or you do not have permission to delete it');
        }

        try {
            $image->delete();
            return $this->success(null, 'Image deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete image: ' . $e->getMessage(), null, 500);
        }
    }
}
