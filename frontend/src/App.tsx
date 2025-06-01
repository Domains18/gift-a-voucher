import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import VoucherForm from './components/VoucherForm';

const App: React.FC = () => {
  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="my-5">
            <VoucherForm />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default App;
