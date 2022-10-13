export function paser(ini: string) {
  const sectionReg = /^([;#])?\[(.+)\]$/;
  const lines = ini.split('\n').map(it => it.trim());
  const sections: Array<{ name: string; disable: boolean; value: Record<string, any> }> = [];
  for (let line of lines) {
    const [_, disable, name] = line.match(sectionReg) ?? [];
    if (name) {
      sections.push({ name, disable: !!disable, value: {} });
      continue;
    }

    let proxy = sections[sections.length - 1];
    if (!proxy) continue;

    if (proxy.disable) {
      line = line.replace(/^[;#\s]+/, '');
    } else {
      if (/^[;#]/.test(line)) continue;
    }

    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const val = line.slice(idx + 1).trim();
    proxy.value[line.slice(0, idx).trim()] = val === 'true' ? true : val === 'false' ? false : /^\d+(\.\d+)?$/.test(val) ? Number(val) : val;
  }
  return sections;
}
