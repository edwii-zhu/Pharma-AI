'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface Contraindication {
  type: 'drug-interaction' | 'condition' | 'allergy' | 'age' | 'other';
  description: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface ContraindicationAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  contraindications: Contraindication[];
  hasSevereContraindications: boolean;
}

const ContraindicationAlert = ({
  isOpen,
  onClose,
  onContinue,
  contraindications,
  hasSevereContraindications
}: ContraindicationAlertProps) => {
  
  const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Low</Badge>;
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {hasSevereContraindications 
              ? "Serious Medication Contraindications Detected" 
              : "Medication Warnings Detected"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            The system has identified potential issues with this medication for this patient. 
            Please review carefully before proceeding.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto">
          {contraindications.map((contraindication, index) => (
            <Alert 
              key={index} 
              variant={contraindication.severity === 'high' ? 'destructive' : 'default'}
              className="border-l-4 border-l-red-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <AlertTitle className="flex items-center gap-2">
                    {getSeverityIcon(contraindication.severity)}
                    {contraindication.type.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="font-medium">{contraindication.description}</p>
                    <p className="text-sm mt-2"><span className="font-semibold">Recommendation:</span> {contraindication.recommendation}</p>
                  </AlertDescription>
                </div>
                <div>
                  {getSeverityBadge(contraindication.severity)}
                </div>
              </div>
            </Alert>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onContinue}
            className={hasSevereContraindications ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {hasSevereContraindications ? 'Proceed With Caution' : 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ContraindicationAlert; 