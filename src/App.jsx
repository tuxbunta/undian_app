import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './App.css';

function App() {
  const [pesertaUmum, setPesertaUmum] = useState([]);
  const [pesertaMarvee, setPesertaMarvee] = useState([]);
  const [pemenang, setPemenang] = useState([]);
  const [filterHadiah, setFilterHadiah] = useState('Semua');
  const [sortOrder, setSortOrder] = useState('hadiah_asc');

  const daftarHadiah = [
    { nama: 'E-voucher KF Mobile 50rb (54 Orang)', batas: 54 },
    { nama: 'Tumbler by Phapros (13 Orang)', batas: 13 },
    { nama: 'E-money hut kf isi 100rb (54 Orang)', batas: 54 },
    { nama: 'Tas Laptop by Phapros (5 Orang)', batas: 5 },
    { nama: 'Sling Bag by Phapros (3 Orang)', batas: 3 },
    { nama: 'Camivit E 200IU (54 Orang)', batas: 54 },
    { nama: 'Selensia Body Wash (20 Orang)', batas: 20 },
    { nama: 'Tas Ransel OGB KF (10 Orang)', batas: 10 },
    { nama: 'Voucher KFD booster vitamin B&C (54 Orang)', batas: 54 },
    { nama: 'Voucher Free Facial by Marvee (20 Orang)', batas: 20 },
  ];
  
  const hadiahUmum = daftarHadiah.filter(h => h.nama !== 'Voucher Free Facial by Marvee (20 Orang)');
  const hadiahMarvee = daftarHadiah.find(h => h.nama === 'Voucher Free Facial by Marvee (20 Orang)');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const marveeList = [];
      const umumList = [];
      
      data.forEach((row, index) => {
        const nama = row['Nama'];
        const lokasi = row['Lokasi'];
        const pesertaId = index + 1;

        const pesertaObj = { id: pesertaId, nama: nama };

        // Peserta JABODETABEK berhak undian Marvee dan undian umum
        if (lokasi && lokasi.toLowerCase().includes('jabodetabek')) {
          marveeList.push(pesertaObj);
          umumList.push(pesertaObj); // Tambahkan juga ke daftar umum
        } else {
          // Peserta di luar JABODETABEK hanya berhak undian umum
          umumList.push(pesertaObj);
        }
      });

      setPesertaUmum(umumList);
      setPesertaMarvee(marveeList);
      setPemenang([]);
      setFilterHadiah('Semua');
      
      alert(`Berhasil mengunggah ${umumList.length} peserta umum dan ${marveeList.length} peserta Marvee (dari JABODETABEK).`);
    };
    reader.readAsBinaryString(file);
  };
  
  const undiHadiah = (daftarPeserta, daftarHadiah) => {
    let sisaPeserta = [...daftarPeserta];
    let daftarPemenangBaru = [];

    daftarHadiah.forEach((hadiahItem) => {
      const jumlahDiundi = Math.min(hadiahItem.batas, sisaPeserta.length);

      for (let i = 0; i < jumlahDiundi; i++) {
        if (sisaPeserta.length === 0) break;
        const randomIndex = Math.floor(Math.random() * sisaPeserta.length);
        const pemenangUndian = sisaPeserta[randomIndex];

        daftarPemenangBaru.push({
          ...pemenangUndian,
          hadiah: hadiahItem.nama,
        });

        sisaPeserta.splice(randomIndex, 1);
      }
    });
    return { pemenang: daftarPemenangBaru, sisaPeserta: sisaPeserta };
  };

  const handleUndiSemua = () => {
    if (pesertaUmum.length === 0 && pesertaMarvee.length === 0) {
      alert('Mohon unggah file peserta terlebih dahulu.');
      return;
    }

    let semuaPemenang = [];
    let sisaPesertaUmum = [...pesertaUmum];
    let sisaPesertaMarvee = [...pesertaMarvee];

    // Undi hadiah Marvee terlebih dahulu, karena hanya peserta JABODETABEK yang bisa memenangkannya
    const hasilMarvee = undiHadiah(sisaPesertaMarvee, [hadiahMarvee]);
    semuaPemenang.push(...hasilMarvee.pemenang);

    // Hapus peserta yang sudah menang Marvee dari daftar peserta umum
    const pemenangMarveeIds = hasilMarvee.pemenang.map(p => p.id);
    sisaPesertaUmum = sisaPesertaUmum.filter(p => !pemenangMarveeIds.includes(p.id));

    // Undi hadiah umum
    const hasilUmum = undiHadiah(sisaPesertaUmum, hadiahUmum);
    semuaPemenang.push(...hasilUmum.pemenang);
    
    setPemenang(semuaPemenang);
    
    // Perbarui sisa peserta
    setPesertaUmum(hasilUmum.sisaPeserta);
    setPesertaMarvee(hasilMarvee.sisaPeserta);
    
    alert(`Proses selesai! Total ${semuaPemenang.length} pemenang terpilih dari kedua kategori.`);
  };

  const handleExport = () => {
    if (pemenang.length === 0) {
      alert('Tidak ada data pemenang untuk diekspor.');
      return;
    }

    const dataExport = pemenang.map((p, index) => ({
      'No.': index + 1,
      'Nama Pemenang': p.nama,
      'Hadiah': p.hadiah,
    }));

    const ws = XLSX.utils.json_to_sheet(dataExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Undian');
    XLSX.writeFile(wb, 'Hasil-Pemenang.xlsx');
  };
  
  //const hadiahUnik = ['Semua', ...new Set(pemenang.map(p => p.hadiah))];
  const hadiahUnik = ['Semua', ...daftarHadiah.map(h => h.nama)];
  // const pemenangTerfilter = pemenang.filter(p => {
  //   if (filterHadiah === 'Semua') {
  //     return true;
  //   }
  //   return p.hadiah === filterHadiah;
  // }).sort((a, b) => {
  //   if (sortOrder === 'nama_asc') {
  //     return a.nama.localeCompare(b.nama);
  //   }
  //   if (sortOrder === 'nama_desc') {
  //     return b.nama.localeCompare(a.nama);
  //   }
  //   if (sortOrder === 'hadiah_asc') {
  //     return a.hadiah.localeCompare(b.hadiah);
  //   }
  //   if (sortOrder === 'hadiah_desc') {
  //     return b.hadiah.localeCompare(a.hadiah);
  //   }
  //   return 0;
  // });
  const pemenangTerfilter = pemenang.filter(p => {
    if (filterHadiah === 'Semua') {
      return true;
    }
    return p.hadiah === filterHadiah;
  }).sort((a, b) => {
    const urutanHadiah = daftarHadiah.map(h => h.nama);
    const indexA = urutanHadiah.indexOf(a.hadiah);
    const indexB = urutanHadiah.indexOf(b.hadiah);
    
    // Urutkan berdasarkan urutan hadiah, kemudian nama pemenang
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return a.nama.localeCompare(b.nama);
  });

  return (
    <div className="container">
      <h1>Pemenang Cinta Produk KF</h1>
      <hr />

      <section>
        <h2>1. Unggah Data Peserta</h2>
        <p>Unggah **satu file Excel** yang berisi kolom `Nama` dan `Lokasi`. Aplikasi akan otomatis memisahkan peserta.</p>
        <div className="upload-box">
          <input type="file" onChange={handleFileUpload} accept=".xls,.xlsx" />
        </div>
      </section>

      <section>
        <h2>2. Penentuan Pemenang</h2>
        <p>
          Klik tombol di bawah ini untuk menentapkan pemenang hadiah secara otomatis.
        </p>
        <button onClick={handleUndiSemua} disabled={pesertaUmum.length === 0}>
          Proses Pemenang Hadiah
        </button>
        <div className="hadiah-list">
          {daftarHadiah.map(h => <p key={h.nama}>{h.nama}</p>)}
        </div>
      </section>

      <section>
        <h2>3. Pemenang Cinta Produk KF</h2>
        <button onClick={handleExport} disabled={pemenang.length === 0}>
          Unduh Hasil ke Excel
        </button>

        {pemenang.length > 0 && (
          <div className="hasil-list">
            <h3>Daftar Pemenang</h3>
            <div className="controls">
              <div className="filter-container">
                <label>Filter Hadiah: </label>
                <select value={filterHadiah} onChange={(e) => setFilterHadiah(e.target.value)}>
                  {hadiahUnik.map(hadiah => (
                    <option key={hadiah} value={hadiah}>{hadiah}</option>
                  ))}
                </select>
              </div>
              <div className="sort-container">
                <label>Urutkan: </label>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="hadiah_asc">Hadiah (A-Z)</option>
                  <option value="hadiah_desc">Hadiah (Z-A)</option>
                  <option value="nama_asc">Nama (A-Z)</option>
                  <option value="nama_desc">Nama (Z-A)</option>
                </select>
              </div>
            </div>
            <ul>
              {pemenangTerfilter.map((p, index) => (
                <li key={index}>
                  <span className="nama-pemenang">{p.nama}</span>
                  <span className="keterangan-menang">memenangkan:</span>
                  <span className="hadiah-pemenang">{p.hadiah}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;