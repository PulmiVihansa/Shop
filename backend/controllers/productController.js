// Placeholder product listing handler.
const getProducts = async (req, res) => {
  res.status(200).json([
    { id: 1, title: 'Classic Denim Jacket', price: 89, category: 'Men', image: '' },
    { id: 2, title: 'Summer Floral Dress', price: 74, category: 'Women', image: '' },
    { id: 3, title: 'Minimalist Sneakers', price: 110, category: 'Accessories', image: '' }
  ]);
};

module.exports = { getProducts };
