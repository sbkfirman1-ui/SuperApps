import Swal from 'sweetalert2';

export const customSwal = Swal.mixin({
  background: '#1a1f2e', // var(--bg-secondary) equivalent
  color: '#f8fafc', // var(--text-main) equivalent
  customClass: {
    popup: 'glass-panel',
    confirmButton: 'btn btn-primary',
    cancelButton: 'btn'
  },
  buttonsStyling: false
});

export const confirmDelete = async (text = 'Yakin ingin menghapus data ini?') => {
  const result = await customSwal.fire({
    title: 'Konfirmasi',
    text: text,
    icon: 'warning',
    iconColor: '#ef4444',
    showCancelButton: true,
    confirmButtonText: 'Ya, Lanjutkan',
    cancelButtonText: 'Batal',
    reverseButtons: true,
    padding: '2rem',
    width: '400px'
  });
  return result.isConfirmed;
};

export const showAlert = (text, type = 'error') => {
  return customSwal.fire({
    title: type === 'error' ? 'Oops...' : 'Berhasil!',
    text: text,
    icon: type,
    padding: '2rem',
    width: '400px'
  });
};
