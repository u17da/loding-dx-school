import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CaseCardProps {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  imageUrl: string;
}

const CaseCard: React.FC<CaseCardProps> = ({ id, title, summary, tags, imageUrl }) => {
  const truncatedSummary = summary.length > 100 
    ? `${summary.substring(0, 100)}...` 
    : summary;

  return (
    <Link href={`/cases/${id}`} className="block">
      <div className="card h-full transition-transform hover:scale-[1.02] hover:shadow-xl">
        <div className="relative h-48 w-full mb-4 rounded-t-2xl overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-xl font-bold text-primary mb-2">{title}</h3>
          <p className="text-text mb-4">{truncatedSummary}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CaseCard;
