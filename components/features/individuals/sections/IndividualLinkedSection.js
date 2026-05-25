'use client';

import { Image, Video, FileText, BookOpen, UserCircle } from 'lucide-react';
import IndividualSection from '../view/IndividualSection';
import TabbedSection from '../view/TabbedSection';

const PHOTO_FORMS = ['image', 'photo', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const VIDEO_FORMS = ['video', 'mp4', 'mov', 'avi', 'webm', 'mpeg'];
const DOC_FORMS = ['pdf', 'doc', 'document', 'application'];

function matchesForm(form, patterns) {
  if (!form) return false;
  const f = String(form).toLowerCase();
  return patterns.some((p) => f.includes(p));
}

function MediaCard({ media, Icon }) {
  return (
    <div className="card bg-base-200/50 border border-base-content/10 rounded-box overflow-hidden">
      <div className="aspect-square bg-base-300 flex items-center justify-center">
        <span className="text-base-content/30 shrink-0 inline-flex"><Icon size={32} /></span>
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium truncate">{media.title || media.fileRef || 'Untitled'}</p>
        {media.form && <p className="text-xs text-base-content/50">{media.form}</p>}
      </div>
    </div>
  );
}

function renderMediaGrid(items, MediaCardComponent, Icon, emptyMsg) {
  return items.length === 0 ? (
    <p className="text-sm text-base-content/50">{emptyMsg}</p>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.map((m, idx) => (
        <MediaCardComponent key={m.id || idx} media={m} Icon={Icon} />
      ))}
    </div>
  );
}

export default function IndividualLinkedSection({ individual }) {
  if (!individual) return null;

  const allMedia = (individual.individualMedia || []).map((im) => im.media).filter(Boolean);
  const photos = allMedia.filter((m) => matchesForm(m.form, PHOTO_FORMS) || (!m.form && !matchesForm(m.form, VIDEO_FORMS) && !matchesForm(m.form, DOC_FORMS)));
  const videos = allMedia.filter((m) => matchesForm(m.form, VIDEO_FORMS));
  const documents = allMedia.filter((m) => matchesForm(m.form, DOC_FORMS));
  const sourcesCount = individual.individualSources?.length ?? 0;
  const storiesCount = 0; // TODO: fetch from StorySubject when API available

  const linkedTabs = [
    { id: 'photos', label: 'Photos', icon: Image, count: photos.length },
    { id: 'videos', label: 'Videos', icon: Video, count: videos.length },
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { id: 'stories', label: 'Stories', icon: BookOpen, count: storiesCount },
    { id: 'profiles', label: 'Profiles', icon: UserCircle, count: sourcesCount },
  ];

  return (
    <TabbedSection title="Linked" showBackToTop tabs={linkedTabs} defaultTab="photos">
      {(activeTab) => (
        <>
          {activeTab === 'photos' && (
            <IndividualSection title="Photos" count={photos.length} subtitle>
              {renderMediaGrid(photos, MediaCard, Image, 'No photos found.')}
            </IndividualSection>
          )}
          {activeTab === 'videos' && (
            <IndividualSection title="Videos" count={videos.length} subtitle>
              {renderMediaGrid(videos, MediaCard, Video, 'No videos found.')}
            </IndividualSection>
          )}
          {activeTab === 'documents' && (
            <IndividualSection title="Documents" count={documents.length} subtitle>
              {renderMediaGrid(documents, MediaCard, FileText, 'No documents found.')}
            </IndividualSection>
          )}
          {activeTab === 'stories' && (
            <IndividualSection title="Stories" count={storiesCount} subtitle>
              {storiesCount === 0 ? (
                <p className="text-sm text-base-content/50">No stories linked yet.</p>
              ) : (
                <p className="text-sm text-base-content/50">Stories will appear here when linked to this individual.</p>
              )}
            </IndividualSection>
          )}
          {activeTab === 'profiles' && (
            <IndividualSection title="Profiles" count={sourcesCount} subtitle>
              {sourcesCount === 0 ? (
                <p className="text-sm text-base-content/50">No profiles found.</p>
              ) : (
                <div className="space-y-3">
                  {(individual.individualSources || []).map((is, idx) => {
                    const src = is.source;
                    if (!src) return null;
                    return (
                      <div
                        key={src.id || idx}
                        className="card bg-base-200/50 border border-base-content/10 rounded-box"
                      >
                        <div className="card-body p-4">
                          <p className="font-medium text-sm">{src.title || src.xref || 'Untitled source'}</p>
                          {src.author && (
                            <p className="text-xs text-base-content/60">By: {src.author}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </IndividualSection>
          )}
        </>
      )}
    </TabbedSection>
  );
}
