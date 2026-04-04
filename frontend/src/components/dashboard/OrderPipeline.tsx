export function OrderPipeline() {
  const pipeline = [
    { status: 'Confirmed', count: 24, bgColor: 'bg-amber' },
    { status: 'Processing', count: 18, bgColor: 'bg-[#B87333]' },
    { status: 'Out for Delivery', count: 12, bgColor: 'bg-amber-dim' },
    { status: 'Delivered', count: 142, bgColor: 'bg-surface-2' },
    { status: 'Completed', count: 850, bgColor: 'bg-surface-2' },
  ];

  const total = pipeline.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-surface border border-border rounded-md p-6">
      <h3 className="text-[13px] font-display text-text-1 mb-6 uppercase tracking-wider">Order Pipeline</h3>
      
      <div className="flex w-full h-8 rounded overflow-hidden gap-0.5 mb-4">
        {pipeline.map((item) => (
          <div 
            key={item.status} 
            className={`${item.bgColor} h-full transition-all duration-300 hover:opacity-80`}
            style={{ width: `${(item.count / total) * 100}%` }}
            title={`${item.status}: ${item.count}`}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {pipeline.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${item.bgColor}`} />
            <span className="text-[12px] text-text-2">{item.status}</span>
            <span className="text-[12px] font-mono text-text-1">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
