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
  ClipboardCheck,
  GraduationCap,
  XCircle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReportData, ControlloCoerenza } from '@/lib/report-parser';

interface VotiFinaliControlliDashboardProps {
  reportData: ReportData;
}

function ControlloCard({ controllo }: { controllo: ControlloCoerenza }) {
  const [isExpanded, setIsExpanded] = React.useState(controllo.stato === 'warning');

  const getStatusConfig = () => {
    switch (controllo.stato) {
      case 'ok':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          borderColor: 'border-green-200 dark:border-green-800',
          iconColor: 'text-green-600',
          badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          label: 'Verificato'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-amber-50 dark:bg-amber-950/30',
          borderColor: 'border-amber-200 dark:border-amber-800',
          iconColor: 'text-amber-600',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
          label: 'Anomalia'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-600',
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

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default'
}: { 
  title: string; 
  value: number | string; 
  subtitle: string; 
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const variantStyles = {
    default: {
      bg: 'bg-card',
      border: 'border-border',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      valueColor: 'text-foreground'
    },
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
    danger: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600',
      valueColor: 'text-red-700 dark:text-red-400'
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
            <p className={cn("text-2xl font-bold", styles.valueColor)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EsitiDistributionBar({ esitiIniziali }: { esitiIniziali: Map<string, number> }) {
  const total = Array.from(esitiIniziali.values()).reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;

  const colors: Record<string, string> = {
    'ammesso': '#22c55e',
    'non ammesso': '#ef4444',
    'sospeso': '#f59e0b',
  };

  const data = Array.from(esitiIniziali.entries()).map(([esito, count]) => ({
    esito,
    count,
    percentuale: (count / total) * 100,
    colore: colors[esito.toLowerCase()] || '#6b7280'
  }));

  return (
    <div className="space-y-3">
      <div className="flex h-8 rounded-lg overflow-hidden">
        {data.map((item, index) => (
          item.percentuale > 0 && (
            <div
              key={index}
              className="flex items-center justify-center text-xs font-medium text-white transition-all hover:opacity-80"
              style={{ 
                width: `${item.percentuale}%`, 
                backgroundColor: item.colore,
                minWidth: item.percentuale > 5 ? 'auto' : '0'
              }}
              title={`${item.esito}: ${item.count} (${item.percentuale.toFixed(1)}%)`}
            >
              {item.percentuale > 10 && `${item.percentuale.toFixed(0)}%`}
            </div>
          )
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full shrink-0" 
              style={{ backgroundColor: item.colore }}
            />
            <span>{item.esito}: <strong>{item.count}</strong> ({item.percentuale.toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VotiFinaliControlliDashboard({ reportData }: VotiFinaliControlliDashboardProps) {
  const { statistiche, analisiEsiti, controlli, riepilogo } = reportData;

  const okCount = controlli.filter(c => c.stato === 'ok').length;
  const warningCount = controlli.filter(c => c.stato === 'warning').length;
  const totalCount = controlli.length;
  const successRate = totalCount > 0 ? (okCount / totalCount) * 100 : 0;

  // Separate controlli by status
  const warningControlli = controlli.filter(c => c.stato === 'warning');
  const okControlli = controlli.filter(c => c.stato === 'ok');
  const infoControlli = controlli.filter(c => c.stato === 'info');

  // Calculate ammessi from esiti finali sospesi
  const ammessiDopoSospensione = analisiEsiti.esitiFinaliSospesi.get('ammesso')?.count || 
                                  analisiEsiti.esitiFinaliSospesi.get('Ammesso')?.count || 0;
  const nonAmmessiDopoSospensione = analisiEsiti.esitiFinaliSospesi.get('non ammesso')?.count || 
                                     analisiEsiti.esitiFinaliSospesi.get('Non ammesso')?.count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Dashboard Controlli Voti Finali</h2>
            <p className="text-sm text-muted-foreground">
              Verifica automatica della qualità dei dati degli scrutini
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {okCount} OK
          </Badge>
          {warningCount > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {warningCount} Anomalie
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Studenti Totali"
          value={riepilogo.studentiTotali || analisiEsiti.totaleStudenti}
          subtitle={`${statistiche.studentiPerClasse.size} classi`}
          icon={Users}
        />
        <StatCard
          title="Scrutini Sospesi"
          value={analisiEsiti.totaleSospesi || riepilogo.studentiSospesi}
          subtitle="a giugno"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Ammessi (dopo sosp.)"
          value={ammessiDopoSospensione}
          subtitle="promossi a settembre"
          icon={GraduationCap}
          variant="success"
        />
        <StatCard
          title="Non Ammessi (dopo sosp.)"
          value={nonAmmessiDopoSospensione}
          subtitle="bocciati a settembre"
          icon={XCircle}
          variant="danger"
        />
      </div>

      {/* Esiti Distribution */}
      {analisiEsiti.esitiIniziali.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribuzione Esiti Iniziali (Giugno)
            </CardTitle>
            <CardDescription>
              Panoramica degli esiti dello scrutinio di giugno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EsitiDistributionBar esitiIniziali={analisiEsiti.esitiIniziali} />
          </CardContent>
        </Card>
      )}

      {/* Esiti Finali Sospesi */}
      {analisiEsiti.esitiFinaliSospesi.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Esiti Finali degli Studenti Sospesi
            </CardTitle>
            <CardDescription>
              Risultati dello scrutinio differito (settembre)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from(analisiEsiti.esitiFinaliSospesi.entries()).map(([esito, data], index) => {
                const isAmmesso = esito.toLowerCase() === 'ammesso';
                return (
                  <div 
                    key={index}
                    className={cn(
                      "text-center p-4 rounded-lg border",
                      isAmmesso 
                        ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" 
                        : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                    )}
                  >
                    <p className={cn(
                      "text-3xl font-bold",
                      isAmmesso ? "text-green-600" : "text-red-600"
                    )}>
                      {data.count}
                    </p>
                    <p className="text-sm font-medium mt-1">{esito}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      isAmmesso ? "text-green-600" : "text-red-600"
                    )}>
                      {data.percentuale.toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tasso di Successo Controlli</span>
            <span className="text-sm font-bold text-green-600">{successRate.toFixed(0)}%</span>
          </div>
          <Progress value={successRate} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{okCount} verificati</span>
            <span>{warningCount} anomalie</span>
          </div>
        </CardContent>
      </Card>

      {/* Anomalie Section */}
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
              <ControlloCard key={`warning-${index}`} controllo={controllo} />
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
              <ControlloCard key={`ok-${index}`} controllo={controllo} />
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
                <ControlloCard key={`info-${index}`} controllo={controllo} />
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