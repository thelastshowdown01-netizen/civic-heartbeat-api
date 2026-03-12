interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ icon, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
