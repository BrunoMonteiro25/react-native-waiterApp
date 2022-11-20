import { ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'

import { Header } from '../components/Header'
import { Menu } from '../components/Menu'
import { Categories } from '../components/Categories'
import { Button } from '../components/Button'
import { TableModal } from '../components/TableModal'
import { Cart } from '../components/Cart'
import { CartItem } from '../types/CartItem'
import { Product } from '../types/Product'
import { Empty } from '../components/Icons/Empty'
import { Text } from '../components/Text'
import { Category } from '../types/Category'

import {
  Container,
  CategoriesContainer,
  MenuContainer,
  Footer,
  FooterContainer,
  CenteredContainer,
} from './styles'
import { api } from '../utils/api'

export function Main() {
  const [isTableModalVisible, setIsTableModalVisible] = useState(false)
  const [selectedTable, setSelectedTable] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/products')]).then(
      ([categoriesResponse, productsResponse]) => {
        setCategories(categoriesResponse.data)
        setProducts(productsResponse.data)
        setIsLoading(false)
      },
    )
  }, [])

  async function handleSelectedCategory(categoryId: string) {
    const route = !categoryId
      ? '/products'
      : `/categories/${categoryId}/products`

    setIsLoadingProducts(true)

    // simular atraso no carregamento
    //await new Promise((resolve) => setTimeout(resolve, 1000))
    const { data } = await api.get(route)
    setProducts(data)
    setIsLoadingProducts(false)
  }

  function handleSaveTable(table: string) {
    setSelectedTable(table)
  }

  function handleResetOrder() {
    setSelectedTable('')
    setCartItems([])
  }

  function handleAddToCart(product: Product) {
    if (!selectedTable) {
      setIsTableModalVisible(true)
    }
    setCartItems((prevState) => {
      const itemIndex = prevState.findIndex(
        (cartItem) => cartItem.product._id === product._id,
      )

      if (itemIndex < 0) {
        return prevState.concat({
          quantity: 1,
          product,
        })
      }

      const newCartItems = [...prevState]
      const item = newCartItems[itemIndex]

      newCartItems[itemIndex] = {
        ...item,
        quantity: item.quantity + 1,
      }

      return newCartItems
    })
  }

  function handleDecrementCartItem(product: Product) {
    setCartItems((prevState) => {
      const itemIndex = prevState.findIndex(
        (cartItem) => cartItem.product._id === product._id,
      )
      const item = prevState[itemIndex]
      const newCartItems = [...prevState]

      if (item.quantity === 1) {
        newCartItems.splice(itemIndex, 1)
        return newCartItems
      }

      newCartItems[itemIndex] = {
        ...item,
        quantity: item.quantity - 1,
      }

      return newCartItems
    })
  }

  return (
    <>
      <Container>
        <Header
          selectedTable={selectedTable}
          onCancelOrder={handleResetOrder}
        />

        {isLoading && (
          <CenteredContainer>
            <ActivityIndicator color="#d73035" size="large" />
          </CenteredContainer>
        )}

        {/* se não estiver carregando */}
        {!isLoading && (
          <>
            <CategoriesContainer>
              <Categories
                categories={categories}
                onSelectCategory={handleSelectedCategory}
              />
            </CategoriesContainer>

            {isLoadingProducts ? (
              <CenteredContainer>
                <ActivityIndicator color="#d73035" size="large" />
              </CenteredContainer>
            ) : (
              <>
                {products.length > 0 ? (
                  <MenuContainer>
                    <Menu onAddToCart={handleAddToCart} products={products} />
                  </MenuContainer>
                ) : (
                  <CenteredContainer>
                    <Empty />
                    <Text color="#666" style={{ marginTop: 24 }}>
                      Nenhum produto foi encontrado
                    </Text>
                  </CenteredContainer>
                )}
              </>
            )}
          </>
        )}
      </Container>

      <Footer>
        <FooterContainer>
          {/* quando não tiver uma mesa selecionada */}
          {!selectedTable && (
            <Button
              onPress={() => setIsTableModalVisible(true)}
              disabled={isLoading}
            >
              Novo Pedido
            </Button>
          )}

          {selectedTable && (
            <Cart
              cartItems={cartItems}
              onAdd={handleAddToCart}
              onDecrement={handleDecrementCartItem}
              onConfirmOrder={handleResetOrder}
              selectedTable={selectedTable}
            />
          )}
        </FooterContainer>
      </Footer>

      <TableModal
        visible={isTableModalVisible}
        onClose={() => setIsTableModalVisible(false)}
        onSave={handleSaveTable}
      />
    </>
  )
}
