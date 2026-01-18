"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Users,
  FileCheck,
  ClipboardCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ControlloCoerenza } from '@/lib/report-parser';

interface ControlliDashboardProps {
  controlli: ControlloCoerenza[];
}

function ControlloCard({ controllo, index }: { controllo: ControlloCoerenza; index: number }) {
  const [isExpanded, setIsExpanded] = React.useState(controllo.stato === 'warning');

  const getStatusConfig = () => {
    switch (controllo.stato) {
      case 'ok':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          borderColor: 'border-green-200 dark:border-green-800',
          iconColor: 'text-green-600',
          badgeVariant: 'default' as const,
          badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          label: 'Verificato'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-amber-50 dark:bg-amber-950/30',
          borderColor: 'border-amber-200 dark:border-amber-800',
          iconColor: 'text-amber-600',
          badgeVariant: 'destructive' as const,
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
          label: 'Anomalia'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-600',
          badgeVariant: 'secondary' as const,
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          label: 'Info'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", config.bgColor, config.borderColor)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold leading-tight">
                {controllo.titolo}
              </CardTitle>
              {controllo.descrizione && (
                <CardDescription className="mt-1 text-sm">
                  {controllo.descrizione}
                </CardDescription>
              )}
            </div>
          </div>
          <Badge className={cn("shrink-0", config.badgeClass)}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      
      {controllo.dettagli.length > 0 && (
        <CardContent className="pt-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-start"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Nascondi dettagli
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Mostra {controllo.dettagli.length} dettagli
              </>
            )}
          </button>
          
          {isExpanded && (
            <div className="mt-3 space-y-2 pl-2 border-l-2 border-muted">
              {controllo.dettagli.map((dettaglio, idx) => (
                <p key={idx} className="text-sm font-mono text-muted-foreground pl-3">
                  {dettaglio}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function SummaryCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant 
}: { 
  title: string; 
  value: number; 
  subtitle: string; 
  icon: React.ElementType;
  variant: 'success' | 'warning' | 'info';
}) {
  const variantStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600',
      valueColor: 'text-green-700 dark:text-green-400'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-700 dark:text-amber-400'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-700 dark:text-blue-400'
    }
  };

  const styles = variantStyles[variant];

  return (
    <Card className={cn(styles.bg, styles.border)}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-xl", styles.iconBg)}>
            <Icon className={cn("h-6 w-6", styles.iconColor)} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-3xl font-bold", styles.valueColor)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ControlliDashboard({ controlli }: ControlliDashboardProps) {
  const okCount = controlli.filter(c => c.stato === 'ok').length;
  const warningCount = controlli.filter(c => c.stato === 'warning').length;
  const infoCount = controlli.filter(c => c.stato === 'info').length;
  const totalCount = controlli.length;
  
  const successRate = totalCount > 0 ? (okCount / totalCount) * 100 : 0;

  // Separate controlli by status for better organization
  const warningControlli = controlli.filter(c => c.stato === 'warning');
  const okControlli = controlli.filter(c => c.stato === 'ok');
  const infoControlli = controlli.filter(c => c.stato === 'info');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Dashboard Controlli di Coerenza</h2>
            <p className="text-sm text-muted-foreground">
              Verifica automatica della qualità dei dati
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Controlli Superati"
          value={okCount}
          subtitle="Nessuna anomalia rilevata"
          icon={ShieldCheck}
          variant="success"
        />
        <SummaryCard
          title="Anomalie Rilevate"
          value={warningCount}
          subtitle="Richiedono attenzione"
          icon={ShieldAlert}
          variant="warning"
        />
        <SummaryCard
          title="Controlli Totali"
          value={totalCount}
          subtitle="Verifiche eseguite"
          icon={Activity}
          variant="info"
        />
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tasso di Successo</span>
            <span className="text-sm font-bold text-green-600">{successRate.toFixed(0)}%</span>
          </div>
          <Progress value={successRate} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{okCount} verificati</span>
            <span>{warningCount} anomalie</span>
          </div>
        </CardContent>
      </Card>

      {/* Anomalie Section (shown first if any) */}
      {warningControlli.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400">
              Anomalie da Verificare ({warningControlli.length})
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {warningControlli.map((controllo, index) => (
              <ControlloCard key={`warning-${index}`} controllo={controllo} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Separator */}
      {warningControlli.length > 0 && okControlli.length > 0 && (
        <Separator />
      )}

      {/* OK Section */}
      {okControlli.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
              Controlli Superati ({okControlli.length})
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {okControlli.map((controllo, index) => (
              <ControlloCard key={`ok-${index}`} controllo={controllo} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      {infoControlli.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                Informazioni ({infoControlli.length})
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {infoControlli.map((controllo, index) => (
                <ControlloCard key={`info-${index}`} controllo={controllo} index={index} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {controlli.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nessun Controllo Disponibile</h3>
              <p className="text-sm text-muted-foreground mt-1">
                I controlli di coerenza verranno visualizzati qui dopo l&apos;elaborazione
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}