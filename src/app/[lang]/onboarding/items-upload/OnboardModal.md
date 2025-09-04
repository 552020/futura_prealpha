# OnboardModal Component

## Purpose

A multi-step modal that guides users through the onboarding process after they upload files.

## When it appears

- **Initially closed** when the page loads
- **Opens automatically** when `handleUploadSuccess` is called (after successful file upload)
- **Controlled by** `showOnboardModal` state in `items-upload-client.tsx`

## Steps

1. **user-info**: Collect user name and email (skipped if already authenticated)
2. **share**: Share the uploaded memory with someone
3. **sign-up**: Create account (optional)

## Key Features

- **Conditional rendering**: Only shows for specific steps (`user-info`, `share`, `sign-up`)
- **Session integration**: Pre-fills data if user is already authenticated
- **Context integration**: Uses `useOnboarding` context for state management
- **API calls**: Updates user info and creates share links

## Props

```typescript
interface OnboardModalProps {
  isOpen: boolean; // Controls modal visibility
  onClose: () => void; // Called when modal should close
  onComplete: () => void; // Called when onboarding is finished
}
```

## Flow

1. User uploads file → `handleUploadSuccess` called
2. `setShowOnboardModal(true)` → Modal opens
3. User completes steps → `onComplete` called
4. Modal closes and user is redirected to profile page

---

# Onboarding Page Analysis (ItemsUploadClient)

## 🎯 Page Structure

```typescript
// Route: /[lang]/onboarding/items-upload
// Component: ItemsUploadClient
// Variation: "leave-one-item"
```

## 🎨 Page Layout

### Main Content

1. **Title**: "Pick up the one and only digital memory."

   - Font size: `text-6xl sm:text-7xl lg:text-8xl` (responsive)
   - Style: `font-bold tracking-tight`

2. **Subtitle**: "And share it with the Future and your most beloved people."

   - Font size: `text-xl sm:text-2xl`
   - Style: `text-muted-foreground`

3. **Upload Button**: Large circular button
   - Size: `w-20 h-20` (80px × 80px)
   - Style: Black/white with hover effects
   - Icon: Plus sign (72px) or loading spinner

### Container Styling

- **Width**: `max-w-[95%] sm:max-w-[90%] lg:max-w-[85%]`
- **Spacing**: `gap-16` between title and upload button
- **Padding**: `px-4 py-8`

## 🔄 Page Flow

1. **Landing**: User arrives at `/onboarding/items-upload`
2. **Upload**: Clicks large circular button → file picker opens
3. **Processing**: File uploads to server (with loading dialog)
4. **Success**: `handleUploadSuccess()` triggers modal
5. **Modal**: Onboarding modal opens with next steps

## 🎨 Page Design Analysis

### Strengths

- ✅ **Clean, focused design** - Single purpose, clear call-to-action
- ✅ **Responsive typography** - Scales well across devices
- ✅ **Accessible** - Proper ARIA labels and keyboard navigation
- ✅ **Loading states** - Clear feedback during upload

### Potential Issues

- ⚠️ **Limited context** - No explanation of what happens after upload
- ⚠️ **No file type guidance** - Users don't know what files are accepted
- ⚠️ **No size limits** - No indication of file size restrictions
- ⚠️ **Single file only** - No indication this is for one file vs multiple

## 🔧 Page Implementation

### Components Used

- `ItemsUploadClient` - Main container
- `ItemUploadButton` - Upload interface
- `OnboardModal` - Next steps (hidden initially)
- `useFileUpload` - Upload logic hook

### State Management

- `showOnboardModal` - Controls modal visibility
- `isLoading` - Upload progress state
- `fileInputRef` - Hidden file input reference

## 📝 Page Content Analysis

### Current Copy

- **Title**: "Pick up the one and only digital memory."
- **Subtitle**: "And share it with the Future and your most beloved people."

### Tone & Messaging

- **Emotional**: "beloved people" creates emotional connection
- **Eternal**: "Future" suggests permanence
- **Exclusive**: "one and only" emphasizes uniqueness

## 🚀 Page Improvement Recommendations

### Immediate Improvements

1. **Add file type guidance** - Show accepted formats
2. **Add size limits** - Display file size restrictions
3. **Progress indicator** - Show upload progress
4. **Error handling** - Better error messages

### UX Enhancements

1. **Preview area** - Show selected file before upload
2. **Drag & drop** - Alternative to button click
3. **File validation** - Real-time validation feedback
4. **Help text** - Explain the process

### Content Refinements

1. **Clearer value proposition** - What happens to the file?
2. **Privacy reassurance** - How is data protected?
3. **Next steps preview** - What comes after upload?
