'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFacet } from 'mycelia-kernel-plugin/react';
import { DashboardLayout } from '@/components';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUploadAndValidateGedcom, useCreateTree } from '@/hooks/mutations/useGedcomMutations';

export default function UploadPage() {
  const router = useRouter();
  const { isReady, isAuthenticated } = useRequireAuth('/login');
  const gedcomFiles = useFacet('gedcomFiles');
  const listeners = useFacet('listeners');
  
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [treeName, setTreeName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Subscribe to facet events
  useEffect(() => {
    if (!listeners) return;

    // Define handlers
    const handleUploadEvent = (event) => {
      console.log('File uploaded:', event.body);
    };

    const handleValidateEvent = (event) => {
      console.log('File validated:', event.body);
    };

    const handleErrorEvent = (event) => {
      console.error('GEDCOM error:', event.body);
      setError(event.body?.error || 'An error occurred');
    };

    // Register listeners
    listeners.on('gedcomFiles:file:uploaded', handleUploadEvent);
    listeners.on('gedcomFiles:file:validated', handleValidateEvent);
    listeners.on('gedcomFiles:error', handleErrorEvent);

    // Cleanup using listeners.off()
    return () => {
      listeners.off('gedcomFiles:file:uploaded', handleUploadEvent);
      listeners.off('gedcomFiles:file:validated', handleValidateEvent);
      listeners.off('gedcomFiles:error', handleErrorEvent);
    };
  }, [listeners]);

  // Show loading while checking auth
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner text-primary loading-lg" />
          <p className="mt-4 text-base-content/60">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after check, the hook will redirect
  // This shouldn't render but just in case
  if (!isAuthenticated) {
    return null;
  }

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    setError(null);
    setValidationResult(null);

    // Validate file type
    const validExtensions = ['.ged', '.gedcom'];
    const fileName = selectedFile.name.toLowerCase();
    const isValidType = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidType) {
      setError('Please select a valid GEDCOM file (.ged or .gedcom)');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    setFile(selectedFile);
    
    // Auto-fill tree name from filename
    if (!treeName) {
      const baseName = selectedFile.name.replace(/\.(ged|gedcom)$/i, '');
      setTreeName(baseName);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const validateMut = useUploadAndValidateGedcom(gedcomFiles);
  const createTreeMut = useCreateTree();
  const validating = validateMut.isPending;

  const handleValidate = () => {
    if (!file || !gedcomFiles) return;
    setError(null);
    setValidationResult(null);
    validateMut.mutate({ file, treeName }, {
      onSuccess: (result) => setValidationResult(result),
      onError: (err) => setError(err.message),
    });
  };

  const handleUpload = () => {
    if (!validationResult?.fileId) {
      setError('Please validate the file first');
      return;
    }
    setUploading(true);
    setError(null);
    createTreeMut.mutate(
      { fileId: validationResult.fileId, name: treeName, description, isPublic },
      {
        onSuccess: (data) => {
          router.push(`/trees/${data.tree.id}`);
        },
        onError: (err) => {
          setError(err.message);
        },
        onSettled: () => {
          setUploading(false);
        },
      }
    );
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setTreeName('');
    setDescription('');
    setIsPublic(false);
    setValidationResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-base-content">📤 Upload GEDCOM File</h1>
          <p className="text-base-content/60 mt-1">
            Upload your family tree file to create a new tree. You'll automatically become the owner.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-base-100 rounded-lg border border-base-content/10 overflow-hidden">
          <div className="p-6 border-b border-base-content/10">
            <h2 className="text-lg font-semibold text-base-content mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-content text-sm mr-2">1</span>
              Select GEDCOM File
            </h2>

            {!file ? (
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-base-content/10 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ged,.gedcom"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-5xl mb-4">📁</div>
<p className="text-base-content font-medium mb-1">
                Drop your GEDCOM file here
                </p>
                <p className="text-sm text-base-content/60">
                  or click to browse • Max 50MB • .ged or .gedcom
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-base-content">{file.name}</p>
                    <p className="text-sm text-base-content/60">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-error"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Tree Details */}
          <div className={`p-6 border-b border-base-content/10 ${!file ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-lg font-semibold text-base-content mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-content text-sm mr-2">2</span>
              Tree Details
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="treeName" className="block text-sm font-medium text-base-content/70 mb-1">
                  Tree Name <span className="text-error">*</span>
                </label>
                <input
                  id="treeName"
                  type="text"
                  value={treeName}
                  onChange={(e) => setTreeName(e.target.value)}
                  placeholder="e.g., Smith Family Tree"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-base-content/70 mb-1">
                  Description <span className="text-base-content/50">(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your family tree..."
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-base-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-base-content/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
                <div>
                  <span className="text-sm font-medium text-base-content">
                    {isPublic ? '🌍 Public Tree' : '🔒 Private Tree'}
                  </span>
                  <p className="text-xs text-base-content/60">
                    {isPublic 
                      ? 'Anyone can view this tree'
                      : 'Only you and people you invite can view this tree'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Validate & Upload */}
          <div className={`p-6 ${!file || !treeName ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-lg font-semibold text-base-content mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-content text-sm mr-2">3</span>
              Validate & Upload
            </h2>

            {!validationResult ? (
              <div className="text-center py-6">
                <p className="text-base-content/60 mb-4">
                  Click validate to check your GEDCOM file before creating the tree.
                </p>
                <button
                  onClick={handleValidate}
                  disabled={validating || !file || !treeName}
                  className="btn btn-primary"
                >
                  {validating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Validating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Validate File
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Validation Results */}
                <div className={`p-4 rounded-lg ${
                  validationResult.valid
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {validationResult.valid ? (
                      <>
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium text-green-800 dark:text-green-300">File is valid!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium text-amber-800 dark:text-amber-300">File has warnings</span>
                      </>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-base-content">
                        {validationResult.summary?.individuals || validationResult.uploadData?.individuals_count || 0}
                      </div>
                      <div className="text-xs text-base-content/60">Individuals</div>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-base-content">
                        {validationResult.summary?.families || validationResult.uploadData?.families_count || 0}
                      </div>
                      <div className="text-xs text-base-content/60">Families</div>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-base-content">
                        {validationResult.summary?.sources || 0}
                      </div>
                      <div className="text-xs text-base-content/60">Sources</div>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-base-content">
                        {validationResult.errors?.length || 0}
                      </div>
                      <div className="text-xs text-base-content/60">Warnings</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleReset}
                    className="btn btn-secondary"
                  >
                    Start Over
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn btn-primary"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating Tree...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Create Tree
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-base-200 rounded-lg">
          <h3 className="font-medium text-base-content mb-2">💡 Tips</h3>
          <ul className="text-sm text-base-content/60 space-y-1">
            <li>• GEDCOM files are exported from most genealogy software (Ancestry, FamilySearch, etc.)</li>
            <li>• Larger files may take a few moments to process</li>
            <li>• You can change visibility settings later from tree settings</li>
            <li>• As the uploader, you'll automatically become the tree owner</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
