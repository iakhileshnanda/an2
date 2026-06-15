import React, { lazy, Suspense } from 'react';

const ChapterChild    = lazy(() => import('@human/chapters/ChapterChild'));
const ChapterCollege  = lazy(() => import('@human/chapters/ChapterCollege'));
const ChapterLove     = lazy(() => import('@human/chapters/ChapterLove'));
const ChapterPlaces   = lazy(() => import('@human/chapters/ChapterPlaces'));
const ChapterMusic    = lazy(() => import('@human/chapters/ChapterMusic'));
const ChapterBeliefs  = lazy(() => import('@human/chapters/ChapterBeliefs'));
const ChapterLetter   = lazy(() => import('@human/chapters/ChapterLetter'));

export default function HumanPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <ChapterChild />
        <ChapterCollege />
        <ChapterLove />
        <ChapterPlaces />
        <ChapterMusic />
        <ChapterBeliefs />
        <ChapterLetter />
      </Suspense>
    </div>
  );
}
