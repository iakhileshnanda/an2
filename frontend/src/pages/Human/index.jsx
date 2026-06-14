import React from 'react';
import ChapterChild from '@human/chapters/ChapterChild';
import ChapterCollege from '@human/chapters/ChapterCollege';
import ChapterLove from '@human/chapters/ChapterLove';
import ChapterPlaces from '@human/chapters/ChapterPlaces';
import ChapterMusic from '@human/chapters/ChapterMusic';
import ChapterBeliefs from '@human/chapters/ChapterBeliefs';
import ChapterLetter from '@human/chapters/ChapterLetter';

export default function HumanPage() {
  return (
    <div className="min-h-screen">
      <ChapterChild />
      <ChapterCollege />
      <ChapterLove />
      <ChapterPlaces />
      <ChapterMusic />
      <ChapterBeliefs />
      <ChapterLetter />
    </div>
  );
}
