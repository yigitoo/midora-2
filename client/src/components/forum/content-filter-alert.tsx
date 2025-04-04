import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ContentFilterLevel = 'none' | 'low' | 'medium' | 'high';

interface ContentFilterAlertProps {
  level: ContentFilterLevel;
  onAcknowledge: () => void;
  className?: string;
}

const ContentFilterAlert: React.FC<ContentFilterAlertProps> = ({
  level,
  onAcknowledge,
  className = '',
}) => {
  if (level === 'none') return null;

  const icons = {
    low: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    medium: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    high: <Shield className="h-5 w-5 text-red-500" />,
    none: null
  };

  const titles = {
    low: 'Minor Content Warning',
    medium: 'Content Warning',
    high: 'Strong Content Warning',
    none: ''
  };

  const descriptions = {
    low: 'This content may contain mildly inappropriate language or themes.',
    medium: 'This content contains potentially objectionable language or themes that some users may find inappropriate.',
    high: 'This content contains strong language or themes that may be offensive or inappropriate for some users.',
    none: ''
  };

  // Use standard variants that are available in the Alert component
  const variants: Record<ContentFilterLevel, "default" | "destructive"> = {
    low: 'default',
    medium: 'default',
    high: 'destructive',
    none: 'default'
  };

  return (
    <Alert variant={variants[level]} className={`mb-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-2 mt-0.5">
          {icons[level]}
        </div>
        <div className="flex-1">
          <AlertTitle className="mb-1">{titles[level]}</AlertTitle>
          <AlertDescription className="mb-3">{descriptions[level]}</AlertDescription>
          <Button size="sm" variant="outline" onClick={onAcknowledge}>
            I understand, show content
          </Button>
        </div>
      </div>
    </Alert>
  );
};

export default ContentFilterAlert;