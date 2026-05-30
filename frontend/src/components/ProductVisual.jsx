const placeholderStyle = {
  display: 'grid',
  placeItems: 'center',
  padding: '1rem',
  background: 'linear-gradient(135deg, #f5f0ea 0%, #ded4ca 100%)',
  color: '#5f5850',
  textAlign: 'center',
  fontSize: '.9rem',
  fontWeight: 600,
};

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

export default function ProductVisual({ product, className = 'pcbg' }) {
  const image = Array.isArray(product?.images) ? product.images.find(Boolean) : '';

  if (image) {
    return <img className={className} src={image} alt={product?.name || 'Product'} style={imageStyle} />;
  }

  return (
    <div className={className} style={placeholderStyle} aria-hidden="true">
      <span>{product?.name || 'Product'}</span>
    </div>
  );
}
