import React, { useState } from 'react';
import { MapPin, Phone, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

export const EmergencyButton = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg animate-pulse"
        aria-label={t('emergency_button')}
      >
        <MapPin className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('emergency_prompt')}</DialogTitle>
            <DialogDescription>{t('emergency_description')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Button variant="outline" className="w-full" onClick={() => alert('Calling emergency services')}>
              <Phone className="mr-2 h-4 w-4" /> {t('call_emergency')}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => alert('Opening map')}>
              <MapPin className="mr-2 h-4 w-4" /> {t('find_nearest_hospital')}
            </Button>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" className="absolute top-2 right-2"><X className="h-4 w-4" /></Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
};
