'use client';

import { useState } from 'react';
import { Image, Video, FileText, BookOpen, UserCircle } from 'lucide-react';
import IndividualSection from './IndividualSection';
import IndividualSectionTabs from './IndividualSectionTabs';
import IndividualSectionTabsContent from './IndividualSectionTabsContent';

const PHOTO_FORMS = ['image', 'photo', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const VIDEO_FORMS = ['video', 'mp4', 'mov', 'avi', 'webm', 'mpeg'];
const DOC_FORMS = ['pdf', 'doc', 'document', 'application'];

function matchesForm(form, patterns) {
  if (!form) return false;
  const f = String(form).toLowerCase();
  return patterns.some((p) => f.includes(p));
}

export default function IndividualEditLinkedSection({ individual }) {
  const [linkedTab, setLinkedTab] = useState('photos');

  if (!individual) return null;

  const allMedia = (individual.individualMedia || []).map((im) => im.media).filter(Boolean);
  const photos = allMedia.filter((m) => matchesForm(m.form, PHOTO_FORMS) || (!m.form && !matchesForm(m.form, VIDEO_FORMS) && !matchesForm(m.form, DOC_FORMS)));
  const videos = allMedia.filter((m) => matchesForm(m.form, VIDEO_FORMS));
  const documents = allMedia.filter((m) => matchesForm(m.form, DOC_FORMS));
  const sourcesCount = individual.individualSources?.length ?? 0;

  const linkedTabs = [
    { id: 'photos', label: 'Photos', icon: Image, count: photos.length },
    { id: 'videos', label: 'Videos', icon: Video, count: videos.length },
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { id: 'stories', label: 'Stories', icon: BookOpen, count: 0 },
    { id: 'profiles', label: 'Profiles', icon: UserCircle, count: sourcesCount },
  ];

  const MediaEditCard = ({ media, Icon }) => (
    <div className="card border border-base-content/10 rounded-box bg-base-100 overflow-hidden">
      <div className="aspect-square bg-base-300 flex items-center justify-center">
        <span className="text-base-content/30 shrink-0 inline-flex"><Icon size={32} /></span>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">Title</label>
          <input
            type="text"
            className="input input-bordered input-sm w-full mt-1"
            defaultValue={media.title ?? media.fileRef ?? ''}
            placeholder="Title"
          />
        </div>
        <p className="text-xs text-base-content/50">Media linking — coming soon</p>
      </div>
    </div>
  );

  const renderMediaGrid = (items, Icon, emptyMsg) =>
    items.length === 0 ? (
      <p className="text-sm text-base-content/50">{emptyMsg}</p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((m, idx) => (
          <MediaEditCard key={m.id || idx} media={m} Icon={Icon} />
        ))}
      </div>
    );

  return (
    <IndividualSection title="Linked" showBackToTop>
      <IndividualSectionTabs tabs={linkedTabs} activeId={linkedTab} onChange={setLinkedTab} />
      <IndividualSectionTabsContent>
        {linkedTab === 'photos' && (
          <IndividualSection title="Photos" count={photos.length} subtitle>
            {renderMediaGrid(photos, Image, 'No photos found.')}
          </IndividualSection>
        )}
        {linkedTab === 'videos' && (
          <IndividualSection title="Videos" count={videos.length} subtitle>
            {renderMediaGrid(videos, Video, 'No videos found.')}
          </IndividualSection>
        )}
        {linkedTab === 'documents' && (
          <IndividualSection title="Documents" count={documents.length} subtitle>
            {renderMediaGrid(documents, FileText, 'No documents found.')}
          </IndividualSection>
        )}
        {linkedTab === 'stories' && (
          <IndividualSection title="Stories" count={0} subtitle>
            <p className="text-sm text-base-content/50">Stories linking — coming soon.</p>
          </IndividualSection>
        )}
        {linkedTab === 'profiles' && (
          <IndividualSection title="Profiles" count={sourcesCount} subtitle>
            {sourcesCount === 0 ? (
              <p className="text-sm text-base-content/50">No profiles found.</p>
            ) : (
              <div className="space-y-4">
                {(individual.individualSources || []).map((is, idx) => {
                  const src = is.source;
                  if (!src) return null;
                  return (
                    <div
                      key={src.id || idx}
                      className="card border border-base-content/10 rounded-box bg-base-100"
                    >
                      <div className="card-body p-4 space-y-2">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                            Title
                          </label>
                          <input
                            type="text"
                            className="input input-bordered w-full mt-1"
                            defaultValue={src.title ?? src.xref ?? ''}
                            placeholder="Source title"
                          />
                        </div>
                        {src.author && (
                          <p className="text-xs text-base-content/60">By: {src.author}</p>
                        )}
                        <p className="text-xs text-base-content/50">Source linking — coming soon</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </IndividualSection>
        )}
      </IndividualSectionTabsContent>
    </IndividualSection>
  );
}
