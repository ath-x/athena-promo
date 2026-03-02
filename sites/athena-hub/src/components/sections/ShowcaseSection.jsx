import React from 'react';
import EditableMedia from '../EditableMedia';
import EditableText from '../EditableText';
import EditableLink from '../EditableLink';

const ShowcaseSection = ({ sectionName, items, sectionStyle }) => {
  return (
    <section id={sectionName} data-dock-section={sectionName} className="py-24 px-6 bg-[var(--color-background)]" style={sectionStyle}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-20 text-center">
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-6 capitalize">
            {sectionName.replace(/_/g, ' ')}
          </h2>
          <div className="h-2 w-24 bg-accent rounded-full mb-8"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {items.map((item, index) => {
            const titleKey = Object.keys(item).find(k => /name|naam|titel|project|header|title/i.test(k)) || 'name';
            const textKey = Object.keys(item).find(k => /beschrijving|omschrijving|description|intro|text|summary/i.test(k)) || 'description';
            const imgKey = Object.keys(item).find(k => /image|foto|afbeelding|url|img/i.test(k)) || 'image';
            const linkData = item.link || item.link_url || "#";
            const linkUrl = (typeof linkData === 'object' && linkData !== null) ? (linkData.url || "#") : linkData;

            return (
              <div key={index} className="group relative flex flex-col rounded-[3rem] overflow-hidden bg-white shadow-2xl transition-all duration-500 hover:-translate-y-4 hover:shadow-accent/20">
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-[16/10] overflow-hidden block relative"
                  onClick={(e) => { if (e.shiftKey) e.preventDefault(); }}
                >
                  <EditableMedia
                    src={item[imgKey]}
                    cmsBind={{ file: sectionName, index: index, key: imgKey }}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    fallback="Project Preview"
                  />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-primary/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter shadow-xl">
                      Shift + Klik voor link
                    </div>
                  </div>
                </a>

                <div className="p-12 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-3xl font-bold text-primary group-hover:text-accent transition-colors">
                      <EditableText value={item[titleKey]} cmsBind={{ file: sectionName, index: index, key: titleKey }} />
                    </h3>
                    {item.category && (
                      <EditableText
                        value={item.category}
                        cmsBind={{ file: sectionName, index: index, key: 'category' }}
                        className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest"
                      />
                    )}
                  </div>

                  <div className="text-lg leading-relaxed text-slate-600 mb-8 line-clamp-3 font-light italic">
                    <EditableText value={item[textKey]} cmsBind={{ file: sectionName, index: index, key: textKey }} />
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                    <EditableLink
                      label={item.link_text || (typeof linkData === 'object' ? linkData.label : "Bekijk Project")}
                      url={linkData}
                      table={sectionName}
                      field="link"
                      id={index}
                      className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs hover:text-accent transition-colors"
                    />
                    <div className="flex gap-3 text-slate-300">
                      <i className="fa-solid fa-laptop-code text-xl"></i>
                      <i className="fa-solid fa-magnifying-glass-chart text-xl"></i>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
