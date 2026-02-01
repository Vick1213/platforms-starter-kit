'use client';

import { useState } from 'react';
import { Star, CheckCircle, Shield, Clock, Users, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ReviewSettings as ReviewSettingsType, defaultReviewSettings } from '@/lib/review-types';

interface ReviewSettingsProps {
  settings: ReviewSettingsType;
  onSave: (settings: ReviewSettingsType) => Promise<void>;
  className?: string;
}

export function ReviewSettingsEditor({
  settings,
  onSave,
  className = '',
}: ReviewSettingsProps) {
  const [localSettings, setLocalSettings] = useState<ReviewSettingsType>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof ReviewSettingsType) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaved(false);
  };

  const handleMinRatingChange = (value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      minimumRatingForDisplay: value,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description,
    icon: Icon,
  }: {
    checked: boolean;
    onChange: () => void;
    label: string;
    description: string;
    icon: React.ElementType;
  }) => (
    <div className="flex items-start justify-between p-4 bg-white border rounded-lg hover:border-orange-200 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Icon className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <Label className="font-medium text-gray-900">{label}</Label>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-orange-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Review Settings</h3>
          <p className="text-sm text-gray-500">Configure how reviews work on your store</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            Saved!
          </span>
        )}
      </div>

      {/* Verification Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
          Verification & Trust
        </h4>
        
        <ToggleSwitch
          checked={localSettings.requirePurchaseVerification}
          onChange={() => handleToggle('requirePurchaseVerification')}
          label="Require Purchase Verification"
          description="Only allow reviews from customers who have purchased the product"
          icon={Shield}
        />

        <ToggleSwitch
          checked={localSettings.showVerifiedBadge}
          onChange={() => handleToggle('showVerifiedBadge')}
          label="Show Verified Badge"
          description="Display a 'Verified Purchase' badge on reviews from verified buyers"
          icon={CheckCircle}
        />
      </div>

      {/* Moderation Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
          Moderation
        </h4>
        
        <ToggleSwitch
          checked={localSettings.autoApprove}
          onChange={() => handleToggle('autoApprove')}
          label="Auto-Approve Reviews"
          description="Automatically publish new reviews without manual approval"
          icon={Clock}
        />

        <ToggleSwitch
          checked={localSettings.allowAnonymous}
          onChange={() => handleToggle('allowAnonymous')}
          label="Allow Anonymous Reviews"
          description="Let reviewers hide their name (shows as 'Anonymous')"
          icon={Users}
        />
      </div>

      {/* Display Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
          Display Options
        </h4>
        
        <ToggleSwitch
          checked={localSettings.showReviewDate}
          onChange={() => handleToggle('showReviewDate')}
          label="Show Review Date"
          description="Display when each review was written"
          icon={Clock}
        />

        <ToggleSwitch
          checked={localSettings.allowSellerResponse}
          onChange={() => handleToggle('allowSellerResponse')}
          label="Seller Responses"
          description="Allow yourself to respond publicly to reviews"
          icon={Users}
        />

        <ToggleSwitch
          checked={localSettings.enableHelpfulVoting}
          onChange={() => handleToggle('enableHelpfulVoting')}
          label="Helpful Voting"
          description="Let customers vote on whether reviews are helpful"
          icon={ThumbsUp}
        />

        {/* Minimum Rating Filter */}
        <div className="p-4 bg-white border rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Star className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <Label className="font-medium text-gray-900">Minimum Rating to Display</Label>
              <p className="text-sm text-gray-500 mt-0.5">
                Only show reviews with at least this rating
              </p>
              <div className="flex items-center gap-3 mt-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleMinRatingChange(star)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-colors ${
                      localSettings.minimumRatingForDisplay === star
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${
                      localSettings.minimumRatingForDisplay === star
                        ? 'fill-white'
                        : 'text-gray-400'
                    }`} />
                    <span className="text-sm">{star}+</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleMinRatingChange(0)}
                  className={`px-3 py-1.5 rounded-full border transition-colors ${
                    localSettings.minimumRatingForDisplay === 0
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <span className="text-sm">All</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
          Notifications
        </h4>
        
        <ToggleSwitch
          checked={localSettings.notifyOnNewReview}
          onChange={() => handleToggle('notifyOnNewReview')}
          label="New Review Alerts"
          description="Get notified when someone leaves a new review"
          icon={Star}
        />

        <ToggleSwitch
          checked={localSettings.notifyOnLowRating}
          onChange={() => handleToggle('notifyOnLowRating')}
          label="Low Rating Alerts"
          description="Get notified when a review has a rating below 3 stars"
          icon={Star}
        />
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isSaving ? 'Saving...' : 'Save Review Settings'}
        </Button>
      </div>
    </div>
  );
}
